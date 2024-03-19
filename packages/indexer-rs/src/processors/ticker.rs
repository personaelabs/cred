use num_bigint::BigUint;

use crate::{
    contract::Contract,
    eth_rpc::EthRpcClient,
    processors::{upsert_group, GroupIndexer},
    rocksdb_key::{RocksDbKey, ERC20_TRANSFER_EVENT_ID},
    tree::save_tree,
    utils::{decode_erc20_transfer_event, is_event_logs_ready, MINTER_ADDRESS},
    GroupType,
};
use std::io::Error;
use std::io::ErrorKind;
use std::{collections::HashMap, sync::Arc};

// The block num and index of transaction: https://basescan.org/tx/0x3122445f0240df9530c8a360fb7631ad5aca4e24503e8856b9aedae05dab830c
const TO_BLOCK_NUMBER: u64 = 11968043;
const TO_TX_INDEX: u32 = 26;

pub struct TickerIndexer {
    balances: HashMap<[u8; 20], BigUint>,
    pub contract: Contract,
    pub group_id: Option<i32>,
    pub pg_client: Arc<tokio_postgres::Client>,
    pub rocksdb_client: Arc<rocksdb::DB>,
    pub eth_client: Arc<EthRpcClient>,
}

impl TickerIndexer {
    pub fn new(
        contract: Contract,
        pg_client: Arc<tokio_postgres::Client>,
        rocksdb_client: Arc<rocksdb::DB>,
        eth_client: Arc<EthRpcClient>,
    ) -> Self {
        TickerIndexer {
            balances: HashMap::new(),
            contract,
            group_id: None,
            pg_client,
            rocksdb_client,
            eth_client,
        }
    }
}

#[async_trait::async_trait]
impl GroupIndexer for TickerIndexer {
    fn group_name(&self) -> String {
        "$ticker rug survivor".to_string()
    }

    fn process_log(&mut self, key: RocksDbKey, log: &[u8]) -> Result<(), std::io::Error> {
        let block_num = key.block_num.unwrap();
        let tx_index = key.tx_index.unwrap();

        // Only process logs up until the specified block number and transaction index
        if block_num > TO_BLOCK_NUMBER || (block_num == TO_BLOCK_NUMBER && tx_index >= TO_TX_INDEX)
        {
            return Ok(());
        }

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
        }

        if self.balances.get(&log.from).is_none() {
            // Initialize the balance of `from` to 0
            self.balances.insert(log.from, BigUint::from(0u8));
        }

        if log.from != MINTER_ADDRESS {
            let balance = self.balances.get(&log.from).unwrap();
            if balance < &log.value {
                return Err(Error::new(ErrorKind::Other, "Insufficient balance"));
            }

            // Decrease balance of `from` by `value`
            let balance = self.balances.get_mut(&log.from).unwrap();
            *balance -= &log.value;
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
        let handle = "ticker-rug-survivor".to_string();
        let display_name = "$ticker rug survivor".to_string();

        let group_id =
            upsert_group(&self.pg_client, &display_name, &handle, GroupType::Ticker).await?;
        self.group_id = Some(group_id);

        Ok(())
    }

    async fn save_tree(&self, block_number: i64) -> Result<(), tokio_postgres::Error> {
        let holders_at_block = self
            .balances
            .iter()
            .filter(|(_, balance)| **balance > BigUint::from(0u8))
            .map(|(holder, _balance)| *holder)
            .collect::<Vec<[u8; 20]>>();

        if let Some(group_id) = self.group_id {
            save_tree(
                group_id,
                GroupType::Ticker,
                &self.pg_client,
                holders_at_block,
                block_number,
            )
            .await?;
        } else {
            panic!("Group ID not set");
        }

        Ok(())
    }
}
