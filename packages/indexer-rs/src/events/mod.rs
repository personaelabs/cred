use crate::{
    rocksdb_key::{KeyType, RocksDbKey},
    utils::{value_to_u32, value_to_u64},
    BlockNum, ContractId, EventId, LogIndex, TxIndex,
};
use serde_json::Value;

pub mod erc1155_batch;
pub mod erc1155_single;
pub mod erc20;
pub mod erc721;

#[derive(Debug, Clone, Copy)]
pub struct EventLogMeta {
    pub block_num: BlockNum,
    pub tx_index: TxIndex,
    pub log_index: LogIndex,
    pub contract_id: ContractId,
    pub event_id: EventId,
}

impl EventLogMeta {
    pub fn from_json(log: &Value, contract_id: ContractId, event_id: EventId) -> Self {
        let log_index = value_to_u32(&log["logIndex"]);
        let tx_index = value_to_u32(&log["transactionIndex"]);
        let block_num = value_to_u64(&log["blockNumber"]);
        Self {
            block_num,
            tx_index,
            log_index,
            contract_id,
            event_id,
        }
    }
}

pub trait EventLogLike: Send + Sync {
    fn from_json(log: &Value, contract_id: ContractId) -> Self
    where
        Self: Sized;
    fn to_bytes(&self) -> Vec<u8>;
    /// Return the metadata of the event
    fn event_meta(&self) -> EventLogMeta;
    // Convert to a rocksdb record
    fn to_rocksdb_record(&self) -> (RocksDbKey, Vec<u8>) {
        let log_index = self.event_meta().log_index;
        let tx_index = self.event_meta().tx_index;
        let block_num = self.event_meta().block_num;
        let contract_id = self.event_meta().contract_id;
        let event_id = self.event_meta().event_id;

        let key = RocksDbKey {
            key_type: KeyType::EventLog,
            event_id: Some(event_id),
            contract_id: Some(contract_id),
            block_num: Some(block_num),
            log_index: Some(log_index),
            tx_index: Some(tx_index),
            chunk_num: None,

            chain_id: None,
        };

        let buf = self.to_bytes();

        (key, buf)
    }
}
