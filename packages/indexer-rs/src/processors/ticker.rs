use crate::{
    contract::Contract,
    contract_event_iterator::ContractEventIterator,
    eth_rpc::Chain,
    group::Group,
    processors::{GroupIndexer, IndexerResources},
    rocksdb_key::ERC20_TRANSFER_EVENT_ID,
    seeder::seed_contracts::get_seed_contracts,
    utils::{decode_erc20_transfer_event, is_event_logs_ready, MINTER_ADDRESS},
    Address, BlockNum, Error, TxIndex,
};
use num_bigint::BigUint;
use std::collections::HashMap;
use std::collections::HashSet;
use std::io::ErrorKind;

// The block num and index of transaction: https://basescan.org/tx/0x3122445f0240df9530c8a360fb7631ad5aca4e24503e8856b9aedae05dab830c
const TO_BLOCK_NUMBER: BlockNum = 11968043;
const TO_TX_INDEX: TxIndex = 26;

pub struct TickerIndexer {
    pub group: Group,
    pub contract: Contract,
    pub resources: IndexerResources,
}

impl TickerIndexer {
    pub fn new(group: Group, resources: IndexerResources) -> Self {
        let ticker_contract = get_seed_contracts()
            .iter()
            .find(|c| c.symbol == "ticker")
            .unwrap()
            .clone();

        let contract = Contract::from_contract_data(ticker_contract);

        TickerIndexer {
            group,
            contract,
            resources,
        }
    }
}

#[async_trait::async_trait]
impl GroupIndexer for TickerIndexer {
    fn chain(&self) -> Chain {
        self.contract.chain
    }

    fn group(&self) -> &Group {
        &self.group
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

    async fn get_members(&self, block_number: BlockNum) -> Result<HashSet<Address>, Error> {
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
                    return Err(Error::Std(std::io::Error::new(
                        ErrorKind::Other,
                        "Insufficient balance",
                    )));
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
        eth_rpc::EthRpcClient,
        log_sync_engine::LogSyncEngine,
        postgres::init_postgres,
        seeder::seed_contracts::get_seed_contracts,
        test_utils::{get_members_from_csv, init_test_rocksdb},
        utils::dotenv_config,
        GroupType,
    };
    use std::sync::Arc;

    #[tokio::test]
    async fn test_ticker_indexer() {
        dotenv_config();
        let db = init_test_rocksdb("test_ticker_indexer");

        let pg_client = init_postgres().await;

        // Get the ticker contract from the seed contracts list
        let ticker_contract = get_seed_contracts()
            .iter()
            .find(|c| c.symbol == "ticker")
            .unwrap()
            .clone();

        let ticker_contract = Contract::from_contract_data(ticker_contract);

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

        let group = Group::new(
            "Test Group".to_string(),
            GroupType::Ticker,
            vec![ticker_contract.clone()],
            0,
        );

        let indexer = TickerIndexer::new(group, resources.clone());

        let members = indexer.get_members(to_block).await.unwrap();

        let expected_members = get_members_from_csv("ticker_rug_survivors.csv");

        // Sort the members as `expected_members` is sorted
        let mut members = members.iter().copied().collect::<Vec<Address>>();
        members.sort();

        assert_eq!(members, expected_members);
    }
}
