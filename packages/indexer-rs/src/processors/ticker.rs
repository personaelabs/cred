use num_bigint::BigUint;

use crate::{
    contract::Contract,
    contract_event_iterator::ContractEventIterator,
    eth_rpc::Chain,
    processors::{GroupIndexer, IndexerResources},
    rocksdb_key::ERC20_TRANSFER_EVENT_ID,
    utils::{decode_erc20_transfer_event, is_event_logs_ready, MINTER_ADDRESS},
    Address, BlockNum, TxIndex,
};
use std::collections::HashMap;
use std::io::ErrorKind;
use std::{collections::HashSet, io::Error};

// The block num and index of transaction: https://basescan.org/tx/0x3122445f0240df9530c8a360fb7631ad5aca4e24503e8856b9aedae05dab830c
const TO_BLOCK_NUMBER: BlockNum = 11968043;
const TO_TX_INDEX: TxIndex = 26;

pub struct TickerIndexer {
    pub contract: Contract,
    pub group_id: i32,
    pub resources: IndexerResources,
}

impl TickerIndexer {
    pub fn new(contract: Contract, group_id: i32, resources: IndexerResources) -> Self {
        TickerIndexer {
            contract,
            group_id,
            resources,
        }
    }
}

#[async_trait::async_trait]
impl GroupIndexer for TickerIndexer {
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

    fn get_members(&self, block_number: BlockNum) -> Result<HashSet<Address>, Error> {
        let iterator = ContractEventIterator::new(
            &self.resources.rocksdb_client,
            ERC20_TRANSFER_EVENT_ID,
            self.contract.id,
            Some(block_number),
        );

        let mut balances = HashMap::new();

        for (key, value) in iterator {
            let block_num = key.block_num.unwrap();
            let tx_index = key.tx_index.unwrap();

            // Only process logs up until the specified block number and transaction index
            if block_num > TO_BLOCK_NUMBER
                || (block_num == TO_BLOCK_NUMBER && tx_index >= TO_TX_INDEX)
            {
                break;
            }

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
            }

            if balances.get(&log.from).is_none() {
                // Initialize the balance of `from` to 0
                balances.insert(log.from, BigUint::from(0u8));
            }

            if log.from != MINTER_ADDRESS {
                let balance = balances.get(&log.from).unwrap();
                if balance < &log.value {
                    return Err(Error::new(ErrorKind::Other, "Insufficient balance"));
                }

                // Decrease balance of `from` by `value`
                let balance = balances.get_mut(&log.from).unwrap();
                *balance -= &log.value;
            }
        }

        let holders_at_block = balances
            .iter()
            .filter(|(_, balance)| **balance > BigUint::from(0u8))
            .map(|(holder, _balance)| *holder)
            .collect::<HashSet<Address>>();

        Ok(holders_at_block)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::{
        contracts::erc20::erc20_contracts, eth_rpc::EthRpcClient, log_sync_engine::LogSyncEngine,
        postgres::init_postgres, test_utils::delete_all, utils::dotenv_config, ROCKSDB_PATH,
    };
    use rocksdb::{Options, DB};
    use std::sync::Arc;

    #[tokio::test]
    async fn test_ticker_indexer() {
        dotenv_config();

        // Use a different path for the test db to avoid conflicts with the main db
        const TEST_ROCKSDB_PATH: &str = "test_ticker_indexer";

        let mut rocksdb_options = Options::default();
        rocksdb_options.create_if_missing(true);

        let db = Arc::new(
            DB::open(
                &rocksdb_options,
                format!("{}/{}", ROCKSDB_PATH, TEST_ROCKSDB_PATH),
            )
            .unwrap(),
        );

        // Delete all records from the test db
        delete_all(&db);

        let pg_client = init_postgres().await;

        let ticker_contract = erc20_contracts()
            .iter()
            .find(|c| c.symbol == "ticker")
            .unwrap()
            .clone();

        // Hardcoded to the latest block number at the time of writing this test,
        // so we can hardcode other values as well.
        let to_block = 12256476;

        let eth_client = Arc::new(EthRpcClient::new());

        let contract_sync_engine = LogSyncEngine::new(
            eth_client.clone(),
            ticker_contract.clone(),
            ERC20_TRANSFER_EVENT_ID,
            db.clone(),
        );
        contract_sync_engine.sync_to_block(to_block).await;

        let resources = IndexerResources {
            pg_client: pg_client.clone(),
            rocksdb_client: db.clone(),
            eth_client: eth_client.clone(),
        };

        let group_id = 1;
        let indexer = TickerIndexer::new(ticker_contract.clone(), group_id, resources.clone());

        let members = indexer.get_members(to_block).unwrap();

        let expected_num_members = 4740;
        assert_eq!(members.len(), expected_num_members);
    }
}
