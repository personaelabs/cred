use crate::{
    contract::Contract,
    contract_event_iterator::ContractEventIterator,
    eth_rpc::Chain,
    group::Group,
    processors::{GroupIndexer, IndexerResources},
    rocksdb_key::ERC20_TRANSFER_EVENT_ID,
    utils::{decode_erc20_transfer_event, is_event_logs_ready},
    Address, BlockNum,
};
use std::{collections::HashSet, io::Error};

pub struct EarlyHolderIndexer {
    pub group: Group,
    pub resources: IndexerResources,
}

impl EarlyHolderIndexer {
    pub fn new(group: Group, resources: IndexerResources) -> Self {
        EarlyHolderIndexer { group, resources }
    }

    fn contract(&self) -> &Contract {
        &self.group.contract_inputs[0]
    }

    fn get_holders(&self, block_number: BlockNum) -> (HashSet<Address>, Vec<Address>) {
        let iterator = ContractEventIterator::new(
            &self.resources.rocksdb_client,
            ERC20_TRANSFER_EVENT_ID,
            self.contract().id,
            Some(block_number),
        );

        let mut unique_holders = HashSet::<Address>::new();
        let mut ordered_holders: Vec<Address> = vec![];

        // Iterate over the logs and collect the holders in order
        for (_, value) in iterator {
            let log = decode_erc20_transfer_event(&value);

            if !unique_holders.contains(&log.to) {
                unique_holders.insert(log.to);
                ordered_holders.push(log.to);
            }
        }

        (unique_holders, ordered_holders)
    }
}

#[async_trait::async_trait]
impl GroupIndexer for EarlyHolderIndexer {
    fn group(&self) -> &Group {
        &self.group
    }

    fn chain(&self) -> Chain {
        self.contract().chain
    }

    fn get_members(&self, block_number: BlockNum) -> Result<HashSet<Address>, Error> {
        let (unique_holders, ordered_holders) = self.get_holders(block_number);

        let total_holders = unique_holders.len();

        // Get the first 5% of the holders
        let earliness_threshold = total_holders / 20;

        let early_holders = ordered_holders
            .iter()
            .take(earliness_threshold)
            .copied()
            .collect();

        Ok(early_holders)
    }

    async fn is_ready(&self) -> Result<bool, surf::Error> {
        is_event_logs_ready(
            &self.resources.rocksdb_client,
            &self.resources.eth_client,
            ERC20_TRANSFER_EVENT_ID,
            &self.contract(),
        )
        .await
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::{
        eth_rpc::EthRpcClient,
        log_sync_engine::LogSyncEngine,
        postgres::init_postgres,
        test_utils::{delete_all, erc20_test_contract},
        utils::dotenv_config,
        GroupType, ROCKSDB_PATH,
    };
    use rocksdb::{Options, DB};
    use std::sync::Arc;

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

        delete_all(&db);

        let pg_client = init_postgres().await;

        let contract = erc20_test_contract();

        // Hardcoded to the latest block number at the time of writing this test,
        // so we can hardcode other values as well.
        let to_block = 19473397;

        let eth_client = Arc::new(EthRpcClient::new());

        let contract_sync_engine = LogSyncEngine::new(
            eth_client.clone(),
            contract.clone(),
            ERC20_TRANSFER_EVENT_ID,
            db.clone(),
        );
        contract_sync_engine.sync_to_block(to_block).await;

        let resources = IndexerResources {
            pg_client: pg_client.clone(),
            rocksdb_client: db.clone(),
            eth_client: eth_client.clone(),
        };

        let group = Group {
            id: Some(1),
            name: "Test Group".to_string(),
            group_type: GroupType::EarlyHolder,
            contract_inputs: vec![contract.clone()],
        };

        let indexer = EarlyHolderIndexer::new(group, resources.clone());

        let (unique_holders, ordered_holders) = indexer.get_holders(to_block);

        // 1. Check that all unique holders were indexed
        let expected_unique_holders = 2664;
        let expected_ordered_holders = 2664;

        assert_eq!(unique_holders.len(), expected_unique_holders);
        assert_eq!(ordered_holders.len(), expected_ordered_holders);

        // 2. Check that the first 5% of the holders are considered early holders
        let expected_early_holders = 133; // 5% of 2664
        let early_holders = indexer.get_members(to_block).unwrap();

        assert_eq!(early_holders.len(), expected_early_holders);
    }
}
