use crate::{
    erc1155_transfer_event, erc20_transfer_event, erc721_transfer_event,
    rocksdb_key::{KeyType, RocksDbKey},
    utils::{value_to_u32, value_to_u64},
};
use crate::{ContractId, EventId};
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

/// Parse JSON log to Punk transfer event data and encode it to Protocol Buffer bytes
pub fn parse_punk_transfer_event_log(log: &Value) -> Vec<u8> {
    let topics = &log["topics"].as_array().unwrap();

    let from = &topics[1].as_str().unwrap();
    let to = &topics[2].as_str().unwrap();

    let from = hex::decode(&from[from.len() - 40..]).unwrap();
    let to = hex::decode(&to[to.len() - 40..]).unwrap();

    let token_id = hex::decode(log["data"].as_str().unwrap().trim_start_matches("0x")).unwrap();

    // We use the same struct as ERC721 transfer event for Punk transfer event
    let transfer_event = erc721_transfer_event::Erc721TransferEvent { from, to, token_id };

    let mut value = Vec::new();
    transfer_event.encode(&mut value).unwrap();

    value
}

pub fn parse_erc1155_transfer_batch_event_log(log: &Value) -> Vec<u8> {
    let topics = &log["topics"].as_array().unwrap();

    let operator = &topics[1].as_str().unwrap();
    let from = &topics[2].as_str().unwrap();
    let to = &topics[3].as_str().unwrap();

    let operator = hex::decode(&operator[operator.len() - 40..]).unwrap();
    let from = hex::decode(&from[from.len() - 40..]).unwrap();
    let to = hex::decode(&to[to.len() - 40..]).unwrap();

    let data = hex::decode(log["data"].as_str().unwrap().trim_start_matches("0x")).unwrap();

    let data_len = data.len();
    // First half of "data" field is ids
    let ids = data[..data_len / 2]
        .to_vec()
        .chunks(32)
        .map(|x| x.to_vec())
        .collect::<Vec<Vec<u8>>>();

    // Second half of "data" field is values
    let values = data[data_len / 2..]
        .to_vec()
        .chunks(32)
        .map(|x| x.to_vec())
        .collect::<Vec<Vec<u8>>>();

    let event = erc1155_transfer_event::Erc1155TransferBatchEvent {
        operator,
        from,
        to,
        ids,
        values,
    };

    let mut value = Vec::new();
    event.encode(&mut value).unwrap();

    value
}

/// Parse JSON log to ERC1155 transfer event data and encode it to Protocol Buffer bytes
pub fn parse_erc1155_transfer_single_event_log(log: &Value) -> Vec<u8> {
    let topics = &log["topics"].as_array().unwrap();

    let operator = &topics[1].as_str().unwrap();
    let from = &topics[2].as_str().unwrap();
    let to = &topics[3].as_str().unwrap();

    let operator = hex::decode(&operator[operator.len() - 40..]).unwrap();
    let from = hex::decode(&from[from.len() - 40..]).unwrap();
    let to = hex::decode(&to[to.len() - 40..]).unwrap();

    let data = hex::decode(log["data"].as_str().unwrap().trim_start_matches("0x")).unwrap();

    // First 32 bytes of "data" field is id
    let id = data[..32].to_vec();
    // Next 32 bytes is value
    let value = data[32..64].to_vec();

    let event = erc1155_transfer_event::Erc1155TransferSingleEvent {
        operator,
        from,
        to,
        id,
        value,
    };

    let mut value = Vec::new();
    event.encode(&mut value).unwrap();

    value
}

/// Parse JSON log to event data and rocksdb key so that it can be stored in the database.
pub fn event_log_to_key_value(
    log: &Value,
    event_id: EventId,
    contract_id: ContractId,
    parser: fn(&Value) -> Vec<u8>,
) -> (RocksDbKey, Vec<u8>) {
    let log_index = value_to_u32(&log["logIndex"]);
    let tx_index = value_to_u32(&log["transactionIndex"]);
    let block_num = value_to_u64(&log["blockNumber"]);

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

    (key, parser(log))
}
