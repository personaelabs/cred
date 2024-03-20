use crate::contract::Contract;
use crate::eth_rpc::EthRpcClient;
use crate::rocksdb_key::{RocksDbKey, ERC20_TRANSFER_EVENT_ID};
use crate::tree::save_tree;
use crate::utils::{decode_erc20_transfer_event, is_event_logs_ready, MINTER_ADDRESS};
use crate::{Address, GroupType};
use num_bigint::BigUint;
use std::collections::{HashMap, HashSet};
use std::io::Error;
use std::io::ErrorKind;
use std::sync::Arc;

use super::{upsert_group, GroupIndexer};

pub fn get_whale_handle(contract_name: &str) -> String {
    format!("whale-{}", contract_name.to_lowercase())
}

pub struct WhaleIndexer {
    eth_client: Arc<EthRpcClient>,
    balances: HashMap<Address, BigUint>,
    total_supply: BigUint,
    whale_threshold: BigUint,
    pg_client: Arc<tokio_postgres::Client>,
    rocksdb_client: Arc<rocksdb::DB>,
    whales: HashSet<Address>,
    contract: Contract,
    group_id: Option<i32>,
}

impl WhaleIndexer {
    pub fn new(
        contract: Contract,
        pg_client: Arc<tokio_postgres::Client>,
        rocksdb_client: Arc<rocksdb::DB>,
        eth_client: Arc<EthRpcClient>,
    ) -> Self {
        WhaleIndexer {
            balances: HashMap::new(),
            total_supply: BigUint::from(0u32),
            whale_threshold: BigUint::from(0u32),
            whales: HashSet::new(),
            pg_client,
            rocksdb_client,
            contract,
            group_id: None,
            eth_client,
        }
    }
}

#[async_trait::async_trait]
impl GroupIndexer for WhaleIndexer {
    fn group_handle(&self) -> String {
        format!("whale-{}", self.contract.name.to_lowercase())
    }

    fn display_name(&self) -> String {
        format!("${} whale", self.contract.symbol.clone().to_uppercase())
    }

    async fn init_group(&mut self) -> Result<(), tokio_postgres::Error> {
        let handle = self.group_handle();
        let display_name = self.display_name();

        let group_id =
            upsert_group(&self.pg_client, &display_name, &handle, GroupType::Whale).await?;
        self.group_id = Some(group_id);

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

    fn process_log(&mut self, _key: RocksDbKey, log: &[u8]) -> Result<(), Error> {
        let log = decode_erc20_transfer_event(log);

        if log.value == BigUint::from(0u8) {
            return Ok(());
        }

        if self.balances.get(&log.to).is_none() {
            // Initialize the balance of `to` to `value`
            self.balances.insert(log.to, log.value.clone());
        } else {
            // Increase balance of `to` by `value`
            let balance = self.balances.get_mut(&log.to).unwrap();
            *balance += &log.value;

            if *balance >= self.whale_threshold {
                self.whales.insert(log.to);
            }
        }

        if self.balances.get(&log.from).is_none() {
            // Initialize the balance of `from` to 0
            self.balances.insert(log.from, BigUint::from(0u8));
        }

        if log.from == MINTER_ADDRESS {
            // Increase total supply by `value`
            self.total_supply += &log.value;

            self.whale_threshold = self.total_supply.clone() / BigUint::from(1000u32);
        } else {
            let balance = self.balances.get(&log.from).unwrap();
            if balance < &log.value {
                return Err(Error::new(ErrorKind::Other, "Insufficient balance"));
            }

            // Decrease balance of `from` by `value`
            let balance = self.balances.get_mut(&log.from).unwrap();
            *balance -= &log.value;
        }

        if log.to == MINTER_ADDRESS {
            // Decrease total supply by `value`
            self.total_supply -= &log.value;

            self.whale_threshold = self.total_supply.clone() / BigUint::from(1000u32);
        };

        Ok(())
    }

    async fn save_tree(&self, block_number: i64) -> Result<(), tokio_postgres::Error> {
        if let Some(group_id) = self.group_id {
            save_tree(
                group_id,
                GroupType::Whale,
                &self.pg_client,
                self.whales.clone().into_iter().collect(),
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
    async fn test_whale_indexer() {
        dotenv_config();

        // Use a different path for the test db to avoid conflicts with the main db
        const TEST_ROCKSDB_PATH: &str = "test_whale_indexer";

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

        let mut indexer = WhaleIndexer::new(
            contract.clone(),
            pg_client,
            db.clone(),
            Arc::new(EthRpcClient::new()),
        );

        let iterator = ContractEventIterator::new(&db, ERC20_TRANSFER_EVENT_ID, contract.id);

        for (key, value) in iterator {
            indexer.process_log(key, &value).unwrap();
        }

        // Check that all the balances were indexed
        let expected_balances_len = 2663;
        assert_eq!(indexer.balances.len(), expected_balances_len);
    }
}
