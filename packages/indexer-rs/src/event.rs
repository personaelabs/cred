use crate::{
    erc20_transfer_event, erc721_transfer_event,
    rocksdb_key::{KeyType, RocksDbKey},
    utils::{value_to_u32, value_to_u64},
};
use prost::Message;
use serde_json::Value;

/// Parse JSON log to ERC20 transfer event data and encode it to Protocol Buffer bytes
pub fn parse_erc20_event_log(log: &Value) -> Vec<u8> {
    let topics = &log["topics"].as_array().unwrap();

    let from = &topics[1].as_str().unwrap();
    let to = &topics[2].as_str().unwrap();

    let value = hex::decode(log["data"].as_str().unwrap().trim_start_matches("0x")).unwrap();

    let from = hex::decode(&from[from.len() - 40..]).unwrap();
    let to = hex::decode(&to[to.len() - 40..]).unwrap();

    let transfer_event = erc20_transfer_event::Erc20TransferEvent { from, to, value };

    let mut value = Vec::new();
    transfer_event.encode(&mut value).unwrap();

    value
}

/// Parse JSON log to ERC721 transfer event data and encode it to Protocol Buffer bytes
pub fn parse_erc721_event_log(log: &Value) -> Vec<u8> {
    let topics = &log["topics"].as_array().unwrap();

    let from = &topics[1].as_str().unwrap();
    let to = &topics[2].as_str().unwrap();
    let token_id = &topics[3].as_str().unwrap();

    let from = hex::decode(&from[from.len() - 40..]).unwrap();
    let to = hex::decode(&to[to.len() - 40..]).unwrap();
    let token_id = hex::decode(&token_id[2..]).unwrap();

    let transfer_event = erc721_transfer_event::Erc721TransferEvent { from, to, token_id };

    let mut value = Vec::new();
    transfer_event.encode(&mut value).unwrap();

    value
}

/// Parse JSON log to event data and rocksdb key so that it can be stored in the database.
pub fn event_log_to_key_value(
    log: &Value,
    event_id: u16,
    contract_id: u16,
    parser: fn(&Value) -> Vec<u8>,
) -> (RocksDbKey, Vec<u8>) {
    let log_index = value_to_u32(&log["logIndex"]);
    let tx_index = value_to_u32(&log["transactionIndex"]);
    let block_num = value_to_u64(&log["blockNumber"]);

    let key = RocksDbKey {
        key_type: KeyType::EventLog,
        event_id,
        contract_id,
        block_num: Some(block_num),
        log_index: Some(log_index),
        tx_index: Some(tx_index),
        chunk_num: None,
    };

    (key, parser(log))
}
