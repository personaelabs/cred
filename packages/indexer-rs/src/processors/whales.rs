use super::GroupIndexer;
use crate::contract::Contract;
use crate::contract_event_iterator::ContractEventIterator;
use crate::eth_rpc::Chain;
use crate::processors::IndexerResources;
use crate::rocksdb_key::ERC20_TRANSFER_EVENT_ID;
use crate::utils::{decode_erc20_transfer_event, is_event_logs_ready, MINTER_ADDRESS};
use crate::Address;
use num_bigint::BigUint;
use std::collections::{HashMap, HashSet};
use std::io::Error;
use std::io::ErrorKind;

pub fn get_whale_handle(contract_name: &str) -> String {
    format!("whale-{}", contract_name.to_lowercase())
}

pub struct WhaleIndexer {
    contract: Contract,
    group_id: i32,
    resources: IndexerResources,
}

impl WhaleIndexer {
    pub fn new(contract: Contract, group_id: i32, resources: IndexerResources) -> Self {
        WhaleIndexer {
            contract,
            group_id,
            resources,
        }
    }

    fn get_whales(
        &self,
        block_number: u64,
    ) -> Result<(HashSet<Address>, HashMap<Address, BigUint>, BigUint), Error> {
        let iterator = ContractEventIterator::new(
            &self.resources.rocksdb_client,
            ERC20_TRANSFER_EVENT_ID,
            self.contract.id,
            Some(block_number),
        );

        let mut balances = HashMap::new();
        let mut total_supply = BigUint::from(0u32);
        let mut whale_threshold = BigUint::from(0u32);
        let mut whales = HashSet::new();

        for (_, value) in iterator {
            let log = decode_erc20_transfer_event(&value);

            if log.value == BigUint::from(0u8) {
                continue;
            }

            if balances.get(&log.to).is_none() {
                // Initialize the balance of `to` to `value`
                balances.insert(log.to, log.value.clone());
            } else {
                // Increase balance of `to` by `value`
                let balance = balances.get_mut(&log.to).unwrap();
                *balance += &log.value;

                if *balance >= whale_threshold {
                    whales.insert(log.to);
                }
            }

            if balances.get(&log.from).is_none() {
                // Initialize the balance of `from` to 0
                balances.insert(log.from, BigUint::from(0u8));
            }

            if log.from == MINTER_ADDRESS {
                // Increase total supply by `value`
                total_supply += &log.value;

                whale_threshold = total_supply.clone() / BigUint::from(1000u32);
            } else {
                let balance = balances.get(&log.from).unwrap();
                if balance < &log.value {
                    return Err(Error::new(ErrorKind::Other, "Insufficient balance"));
                }

                // Decrease balance of `from` by `value`
                let balance = balances.get_mut(&log.from).unwrap();
                *balance -= &log.value;
            }

            if log.to == MINTER_ADDRESS {
                // Decrease total supply by `value`
                total_supply -= &log.value;

                whale_threshold = total_supply.clone() / BigUint::from(1000u32);
            };
        }

        Ok((whales, balances, total_supply))
    }
}

#[async_trait::async_trait]
impl GroupIndexer for WhaleIndexer {
    fn chain(&self) -> Chain {
        self.contract.chain
    }

    fn group_id(&self) -> i32 {
        self.group_id
    }

    async fn is_ready(&self) -> Result<bool, surf::Error> {
        is_event_logs_ready(
            &self.resources.rocksdb_client,
            &self.resources.eth_client,
            ERC20_TRANSFER_EVENT_ID,
            &self.contract,
        )
        .await
    }

    fn get_members(&self, block_number: u64) -> Result<HashSet<Address>, Error> {
        let (whales, _, _) = self.get_whales(block_number)?;
        Ok(whales)
    }
}

#[cfg(test)]
mod test {
    use std::{str::FromStr, sync::Arc};

    use super::*;
    use crate::{
        eth_rpc::EthRpcClient,
        log_sync_engine::LogSyncEngine,
        postgres::init_postgres,
        test_utils::{delete_all, erc20_test_contract},
        utils::dotenv_config,
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
            rocksdb_client: db.clone(),
            pg_client,
            eth_client,
        };

        let group_id = 1;
        let whale_indexer = WhaleIndexer::new(contract, group_id, resources);

        let (_, balances, total_supply) = whale_indexer.get_whales(to_block).unwrap();

        let expected_balances_len = 2663;
        assert_eq!(balances.len(), expected_balances_len);

        let expected_total_supply = BigUint::from_str("25000000000000000000000000000").unwrap();
        assert_eq!(total_supply, expected_total_supply);
    }
}
