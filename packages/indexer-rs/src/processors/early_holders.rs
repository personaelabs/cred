use crate::{
    contract::Contract,
    eth_rpc::EthRpcClient,
    processors::{upsert_group, GroupIndexer},
    rocksdb_key::{RocksDbKey, ERC20_TRANSFER_EVENT_ID},
    tree::save_tree,
    utils::{decode_erc20_transfer_event, is_event_logs_ready},
    Address, GroupType,
};
use std::{collections::HashSet, sync::Arc};

pub struct EarlyHolderIndexer {
    pub unique_holders: HashSet<Address>,
    pub ordered_holders: Vec<Address>,
    pub contract: Contract,
    pub group_id: Option<i32>,
    pub pg_client: Arc<tokio_postgres::Client>,
    pub rocksdb_client: Arc<rocksdb::DB>,
    pub eth_client: Arc<EthRpcClient>,
}

impl EarlyHolderIndexer {
    pub fn new(
        contract: Contract,
        pg_client: Arc<tokio_postgres::Client>,
        rocksdb_client: Arc<rocksdb::DB>,
        eth_client: Arc<EthRpcClient>,
    ) -> Self {
        EarlyHolderIndexer {
            unique_holders: HashSet::new(),
            ordered_holders: Vec::new(),
            contract,
            group_id: None,
            pg_client,
            rocksdb_client,
            eth_client,
        }
    }
}

#[async_trait::async_trait]
impl GroupIndexer for EarlyHolderIndexer {
    fn group_handle(&self) -> String {
        format!("early-holder-{}", self.contract.name.to_lowercase())
    }

    fn display_name(&self) -> String {
        format!(
            "Early ${} holder",
            self.contract.symbol.clone().to_uppercase()
        )
    }

    fn process_log(&mut self, _key: RocksDbKey, log: &[u8]) -> Result<(), std::io::Error> {
        let log = decode_erc20_transfer_event(log);

        if !self.unique_holders.contains(&log.to) {
            self.unique_holders.insert(log.to);
            self.ordered_holders.push(log.to);
        }

        Ok(())
    }

    async fn is_ready(&self) -> Result<bool, surf::Error> {
        is_event_logs_ready(
            &self.rocksdb_client,
            &self.eth_client,
            ERC20_TRANSFER_EVENT_ID,
            &self.contract,
        )
        .await
    }

    async fn init_group(&mut self) -> Result<(), tokio_postgres::Error> {
        let handle = self.group_handle();
        let display_name = self.display_name();

        let group_id = upsert_group(
            &self.pg_client,
            &display_name,
            &handle,
            GroupType::EarlyHolder,
        )
        .await?;
        self.group_id = Some(group_id);

        Ok(())
    }

    async fn save_tree(&self, block_number: i64) -> Result<(), tokio_postgres::Error> {
        let total_holders = self.unique_holders.len();

        // Get the first 5% of the holders
        let earliness_threshold = total_holders / 20;

        let early_holders = self
            .ordered_holders
            .iter()
            .take(earliness_threshold)
            .copied()
            .collect();

        if let Some(group_id) = self.group_id {
            save_tree(
                group_id,
                GroupType::EarlyHolder,
                &self.pg_client,
                early_holders,
                block_number,
            )
            .await?;
        } else {
            panic!("Group ID not set");
        }

        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::{
        contract_event_iterator::ContractEventIterator, log_sync_engine::LogSyncEngine,
        postgres::init_postgres, test_utils::erc20_test_contract, utils::dotenv_config,
        ROCKSDB_PATH,
    };
    use rocksdb::{Options, DB};

    #[tokio::test]
    async fn test_early_holders_indexer() {
        dotenv_config();

        // Use a different path for the test db to avoid conflicts with the main db
        const TEST_ROCKSDB_PATH: &str = "test_early_holders_indexer";

        let mut rocksdb_options = Options::default();
        rocksdb_options.create_if_missing(true);

        let db = Arc::new(
            DB::open(
                &rocksdb_options,
                format!("{}/{}", ROCKSDB_PATH, TEST_ROCKSDB_PATH),
            )
            .unwrap(),
        );

        let pg_client = init_postgres().await;

        let contract = erc20_test_contract();

        // Hardcoded to the latest block number at the time of writing this test,
        // so we can hardcode other values as well.
        let to_block = 19473397;

        let eth_client = Arc::new(EthRpcClient::new());

        let contract_sync_engine = LogSyncEngine::new(eth_client, contract.clone(), db.clone());
        contract_sync_engine.sync_to_block(to_block).await;

        let mut indexer = EarlyHolderIndexer::new(
            contract.clone(),
            pg_client,
            db.clone(),
            Arc::new(EthRpcClient::new()),
        );

        let iterator = ContractEventIterator::new(&db, ERC20_TRANSFER_EVENT_ID, contract.id);

        for (key, value) in iterator {
            indexer.process_log(key, &value).unwrap();
        }

        // 1. Check that all unique holders were indexed
        let expected_unique_holders = 2664;
        let expected_ordered_holders = 2664;

        assert_eq!(indexer.unique_holders.len(), expected_unique_holders);
        assert_eq!(indexer.ordered_holders.len(), expected_ordered_holders);
    }
}
