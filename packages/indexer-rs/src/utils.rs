use crate::{
    contract::Contract,
    erc20_transfer_event, erc721_transfer_event,
    eth_rpc::EthRpcClient,
    log_sync_engine::CHUNK_SIZE,
    rocksdb_key::{KeyType, RocksDbKey},
    ERC20TransferEvent, ERC721TransferEvent,
};
use num_bigint::BigUint;
use prost::Message;
use rocksdb::{IteratorMode, DB};
use serde_json::Value;
use std::io::Cursor;
use tokio::sync::Semaphore;

pub fn dev_addresses() -> Vec<[u8; 20]> {
    let addresses = [
        "4f7d469a5237bd5feae5a3d852eea4b65e06aad1", // pfeffunit.eth
        "cb46219ba114245c3a18761e4f7891f9c4bef8c0", // lsankar.eth
        "400ea6522867456e988235675b9cb5b1cf5b79c8", // dantehrani.eth
    ];

    addresses
        .iter()
        .map(|s| hex::decode(s).unwrap().try_into().unwrap())
        .collect()
}

/// Convert a serde_json Value to u64 by parsing it as a hex string
pub fn value_to_u64(value: &Value) -> u64 {
    u64::from_str_radix(value.as_str().unwrap().trim_start_matches("0x"), 16).unwrap()
}

/// Convert a serde_json Value to u32
pub fn value_to_u32(value: &Value) -> u32 {
    u32::from_str_radix(value.as_str().unwrap().trim_start_matches("0x"), 16).unwrap()
}

/// Get the latest synched chunk
pub fn get_latest_synched_chunk(
    rocksdb_client: &DB,
    event_id: u16,
    contract_id: u16,
) -> Option<u64> {
    let start_key = RocksDbKey::new_start_key(KeyType::SyncLog, event_id, contract_id);

    let iterator = rocksdb_client.iterator(IteratorMode::From(
        &start_key.to_bytes(),
        rocksdb::Direction::Forward,
    ));

    let mut latest_chunk = None;
    for item in iterator {
        let (key_bytes, _value) = item.unwrap();

        let key = RocksDbKey::from_bytes(key_bytes.as_ref().try_into().unwrap());

        if key.key_type != KeyType::SyncLog
            || key.event_id != event_id
            || key.contract_id != contract_id
        {
            break;
        }

        latest_chunk = key.chunk_num;
    }

    latest_chunk
}

/// Check if there are any missing chunks in the sync log for a given event and contract
pub fn missing_chunk_exists(db: &DB, event_id: u16, contract_id: u16) -> bool {
    let start_key = RocksDbKey::new_start_key(KeyType::SyncLog, event_id, contract_id);

    let iterator = db.iterator(IteratorMode::From(
        &start_key.to_bytes(),
        rocksdb::Direction::Forward,
    ));

    for (expected_chunk_num, item) in iterator.enumerate() {
        let key = item.unwrap().0;
        let key = RocksDbKey::from_bytes(key.as_ref().try_into().unwrap());

        if key.key_type != KeyType::SyncLog
            || key.event_id != event_id
            || key.contract_id != contract_id
        {
            break;
        }

        if key.chunk_num != Some(expected_chunk_num as u64) {
            return true;
        }
    }

    false
}

pub fn get_contract_total_chunks(latest_block: u64, contract: &Contract) -> u64 {
    f64::ceil(((latest_block - contract.deployed_block) as f64) / CHUNK_SIZE as f64) as u64
}

pub async fn is_event_logs_ready(
    db: &DB,
    eth_client: &EthRpcClient,
    event_id: u16,
    contract: &Contract,
) -> Result<bool, surf::Error> {
    let semaphore = Semaphore::new(1);
    let block_num = eth_client
        .get_block_number(&semaphore, contract.chain)
        .await?;

    let total_chunks = get_contract_total_chunks(block_num, contract);

    let max_synched_chunk = get_latest_synched_chunk(db, event_id, contract.id);

    let max_synched_chunk = match max_synched_chunk {
        Some(max_synched_chunk) => max_synched_chunk,
        None => return Ok(false),
    };

    let missing_chunk_exists = missing_chunk_exists(&db, event_id, contract.id);

    if (total_chunks - 1) == max_synched_chunk && !missing_chunk_exists {
        Ok(true)
    } else {
        Ok(false)
    }
}

pub fn decode_erc20_transfer_event(value: &[u8]) -> ERC20TransferEvent {
    let decoded =
        erc20_transfer_event::Erc20TransferEvent::decode(&mut Cursor::new(&value)).unwrap();

    ERC20TransferEvent {
        from: decoded.from.try_into().unwrap(),
        to: decoded.to.try_into().unwrap(),
        value: BigUint::from_bytes_be(&decoded.value),
    }
}

pub fn decode_erc721_transfer_event(value: &[u8]) -> ERC721TransferEvent {
    let decoded =
        erc721_transfer_event::Erc721TransferEvent::decode(&mut Cursor::new(&value)).unwrap();

    ERC721TransferEvent {
        from: decoded.from.try_into().unwrap(),
        to: decoded.to.try_into().unwrap(),
        token_id: BigUint::from_bytes_be(&decoded.token_id),
    }
}
