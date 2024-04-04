use super::GroupIndexer;

use crate::contract::Contract;
use crate::contract_event_iterator::ContractEventIterator;
use crate::eth_rpc::Chain;
use crate::group::Group;
use crate::log_sync_engine::TRANSFER_EVENT_SIG;
use crate::processors::IndexerResources;
use crate::rocksdb_key::ERC20_TRANSFER_EVENT_ID;
use crate::utils::{
    decode_erc20_transfer_event, get_balance_at_block, get_total_supply_at_block,
    is_event_logs_ready, MINTER_ADDRESS,
};
use crate::{Address, BlockNum};
use crate::{Error, IndexerError};
use num_bigint::BigUint;
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet};

pub fn get_whale_handle(contract_name: &str) -> String {
    format!("whale-{}", contract_name.to_lowercase())
}

pub struct WhaleIndexer {
    group: Group,
    resources: IndexerResources,
}

impl WhaleIndexer {
    pub fn new(group: Group, resources: IndexerResources) -> Self {
        WhaleIndexer { group, resources }
    }

    fn contract(&self) -> &Contract {
        &self.group.contract_inputs[0]
    }

    fn get_whales(
        &self,
        block_number: u64,
    ) -> Result<(HashSet<Address>, HashMap<Address, BigUint>, BigUint), Error> {
        let iterator = ContractEventIterator::new(
            &self.resources.rocksdb_client,
            ERC20_TRANSFER_EVENT_ID,
            self.contract().id,
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
                    return Err(IndexerError::InvalidBalance.into());
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
        self.contract().chain
    }

    fn group(&self) -> &Group {
        &self.group
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

    async fn get_members(&self, block_number: u64) -> Result<HashSet<Address>, Error> {
        let (whales, _, _) = self.get_whales(block_number)?;
        Ok(whales)
    }

    async fn sanity_check_members(
        &self,
        _members: &[Address],
        _block_number: BlockNum,
    ) -> Result<bool, Error> {
        /*
        let contract = self.contract();
        for member in members {
            let member = hex::encode(member);
            // Get logs where the balance of the address increases
            let params = json!({
                "address": contract.address.clone(),
                "topics": [
                    TRANSFER_EVENT_SIG,
                    Value::Null,
                    format!("0x{:0>width$}", member, width = 64),
                ],
                "fromBlock": "earliest",
                "toBlock": format!("0x{:x}", block_number),
            });

            let result = self
                .resources
                .eth_client
                .get_logs(contract.chain, &params)
                .await
                .unwrap();

            let block_nums = result["result"]
                .as_array()
                .unwrap()
                .iter()
                .map(|log| {
                    let block_num = log["blockNumber"].as_str().unwrap();
                    u64::from_str_radix(block_num.trim_start_matches("0x"), 16).unwrap()
                })
                .collect::<Vec<BlockNum>>();

            // Make sure that the address has received a transfer before

            let mut is_whale = false;

            // Check the balance of the address at each block
            // where the balance increased
            for block_num in &block_nums {
                // Get the balance of the address at the block
                let balance = get_balance_at_block(
                    &self.resources.eth_client,
                    &contract,
                    &member,
                    block_num + 1,
                )
                .await;

                // Get the total supply at the block
                let total_supply =
                    get_total_supply_at_block(&self.resources.eth_client, &contract, block_num + 1)
                        .await;

                let whale_threshold = total_supply.clone() / BigUint::from(1000u32);

                if balance >= whale_threshold {
                    // We found a block where the address had a balance greater than 0.1% of the total supply
                    is_whale = true;
                    break;
                }
            }

            if !is_whale || block_nums.is_empty() {
                return Ok(false);
            }
        }
         */

        Ok(true)
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
        test_utils::{erc20_test_contract, init_test_rocksdb},
        utils::dotenv_config,
        GroupType,
    };

    #[tokio::test]
    async fn test_whale_indexer() {
        dotenv_config();

        let db = init_test_rocksdb("test_whale_indexer");

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

        let group = Group::new(
            "Test group".to_string(),
            GroupType::Whale,
            vec![contract.clone()],
            0,
        );

        let whale_indexer = WhaleIndexer::new(group, resources);

        let (_, balances, total_supply) = whale_indexer.get_whales(to_block).unwrap();

        let expected_balances_len = 2663;
        assert_eq!(balances.len(), expected_balances_len);

        let expected_total_supply = BigUint::from_str("25000000000000000000000000000").unwrap();
        assert_eq!(total_supply, expected_total_supply);
    }
}
