use crate::{
    contract::Contract,
    contract_event_iterator::ContractEventIterator,
    erc1155_transfer_event, erc20_transfer_event, erc721_transfer_event,
    eth_rpc::EthRpcClient,
    log_sync_engine::CHUNK_SIZE,
    rocksdb_key::{KeyType, RocksDbKey},
    BlockNum, ChunkNum, ERC1155TransferBatchEvent, ERC1155TransferSingleEvent, ERC20TransferEvent,
    ERC721TransferEvent, GroupType,
};
use crate::{Address, ContractId, EventId};
use num_bigint::BigUint;
use prost::Message;
use rocksdb::{IteratorMode, DB};
use serde_json::Value;
use std::{env, io::Cursor};

pub const MINTER_ADDRESS: Address = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

pub fn dev_addresses() -> Vec<Address> {
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
/// Return true if the environment is production
pub fn is_prod() -> bool {
    let is_render = env::var("RENDER").is_ok_and(|var| var == "true");
    let is_pull_request = env::var("IS_PULL_REQUEST").is_ok_and(|val| val == "true");

    is_render && !is_pull_request
}

/// Load environment variables from .env file in development environment
pub fn dotenv_config() {
    let _ = env_logger::try_init();

    let is_render = env::var("RENDER").is_ok();
    let manifest_dir = env::var("CARGO_MANIFEST_DIR");
    if !is_render && manifest_dir.is_ok() {
        // Call dotenv in non-render environment
        dotenv::from_filename(format!("{}/.env", manifest_dir.unwrap())).ok();
        dotenv::dotenv().ok();
    } else {
        dotenv::dotenv().ok();
    }
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
    event_id: EventId,
    contract_id: ContractId,
) -> Option<ChunkNum> {
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
pub fn missing_chunk_exists(db: &DB, event_id: EventId, contract_id: ContractId) -> bool {
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

        if key.chunk_num != Some(expected_chunk_num as ChunkNum) {
            return true;
        }
    }

    false
}

pub fn get_contract_total_chunks(latest_block: BlockNum, contract: &Contract) -> u64 {
    f64::ceil(((latest_block - contract.deployed_block) as f64) / CHUNK_SIZE as f64) as u64
}

pub async fn is_event_logs_ready(
    db: &DB,
    eth_client: &EthRpcClient,
    event_id: EventId,
    contract: &Contract,
) -> Result<bool, surf::Error> {
    let block_num = eth_client.get_block_number(contract.chain).await?;

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

/// Decode ERC20 transfer protobuf bytes to ERC20TransferEvent
pub fn decode_erc20_transfer_event(value: &[u8]) -> ERC20TransferEvent {
    let decoded =
        erc20_transfer_event::Erc20TransferEvent::decode(&mut Cursor::new(&value)).unwrap();

    ERC20TransferEvent {
        from: decoded.from.try_into().unwrap(),
        to: decoded.to.try_into().unwrap(),
        value: BigUint::from_bytes_be(&decoded.value),
    }
}

/// Decode ERC721 transfer protobuf bytes to ERC721TransferEvent
pub fn decode_erc721_transfer_event(value: &[u8]) -> ERC721TransferEvent {
    let decoded =
        erc721_transfer_event::Erc721TransferEvent::decode(&mut Cursor::new(&value)).unwrap();

    ERC721TransferEvent {
        from: decoded.from.try_into().unwrap(),
        to: decoded.to.try_into().unwrap(),
        token_id: BigUint::from_bytes_be(&decoded.token_id),
    }
}

pub fn decode_erc1155_transfer_single_event(value: &[u8]) -> ERC1155TransferSingleEvent {
    let decoded =
        erc1155_transfer_event::Erc1155TransferSingleEvent::decode(&mut Cursor::new(&value))
            .unwrap();

    ERC1155TransferSingleEvent {
        from: decoded.from.try_into().unwrap(),
        to: decoded.to.try_into().unwrap(),
        id: BigUint::from_bytes_be(&decoded.id),
    }
}

pub fn decode_erc1155_transfer_batch_event(value: &[u8]) -> ERC1155TransferBatchEvent {
    let decoded =
        erc1155_transfer_event::Erc1155TransferBatchEvent::decode(&mut Cursor::new(&value))
            .unwrap();

    ERC1155TransferBatchEvent {
        from: decoded.from.try_into().unwrap(),
        to: decoded.to.try_into().unwrap(),
        ids: decoded
            .ids
            .iter()
            .map(|id| BigUint::from_bytes_be(id))
            .collect(),
        values: decoded
            .values
            .iter()
            .map(|value| BigUint::from_bytes_be(value))
            .collect(),
    }
}

/// Count the number of synched logs for a given contract event
pub fn count_synched_logs(
    rocksdb_conn: &DB,
    event_id: EventId,
    contract_id: ContractId,
    to_block: Option<BlockNum>,
) -> i32 {
    let iterator = ContractEventIterator::new(rocksdb_conn, event_id, contract_id, to_block);
    iterator.count() as i32
}

pub fn get_handle_from_contract_and_group(contract: &Contract, group_type: GroupType) -> String {
    match group_type {
        GroupType::EarlyHolder => format!("early-holder-{}", contract.name.to_lowercase()),
        GroupType::Whale => format!("whale-{}", contract.name.to_lowercase()),
        GroupType::AllHolders => format!("{}-all-holders", contract.name.to_lowercase()),
        GroupType::Ticker => "ticker-rug-survivor".to_string(),
        _ => panic!("Invalid group type"),
    }
}

pub fn get_display_name_from_contract_and_group(
    contract: &Contract,
    group_type: GroupType,
) -> String {
    match group_type {
        GroupType::EarlyHolder => format!("Early {} holder", contract.name),
        GroupType::Whale => format!("{} whale", contract.name),
        GroupType::AllHolders => format!("{} historical holder", contract.name),
        GroupType::Ticker => "$ticker rug survivor".to_string(),
        _ => panic!("Invalid group type"),
    }
}
