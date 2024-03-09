use crate::rocksdb_key::{KeyType, RocksDbKey};
use rocksdb::{IteratorMode, DB};
use serde_json::Value;

/// Convert a serde_json Value to u64 by parsing it as a hex string
pub fn value_to_u64(value: &Value) -> u64 {
    u64::from_str_radix(value.as_str().unwrap().trim_start_matches("0x"), 16).unwrap()
}

/// Convert a serde_json Value to u32
pub fn value_to_u32(value: &Value) -> u32 {
    u32::from_str_radix(value.as_str().unwrap().trim_start_matches("0x"), 16).unwrap()
}

pub fn get_latest_synched_block_num(db: &DB, event_id: u16, contract_id: u16) -> Option<u64> {
    let mut start_key = RocksDbKey::new_start_key(KeyType::SyncLog, event_id, contract_id);

    start_key.block_num = Some(u64::MAX);
    start_key.log_index = Some(u32::MAX);
    start_key.tx_index = Some(u32::MAX);

    let mut iterator = db.iterator(IteratorMode::From(
        &start_key.to_bytes(),
        rocksdb::Direction::Reverse,
    ));

    let key = iterator.next().unwrap().unwrap().0;
    let key = RocksDbKey::from_bytes(key.as_ref().try_into().unwrap());

    if key.key_type != KeyType::SyncLog
        || key.event_id != event_id
        || key.contract_id != contract_id
    {
        None
    } else {
        Some(key.block_num.unwrap())
    }
}
