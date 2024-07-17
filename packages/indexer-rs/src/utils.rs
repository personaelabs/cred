use crate::{
    block_timestamp_iterator::BlockTimestampIterator,
    contract::Contract,
    contract_event_iterator::ContractEventIterator,
    erc1155_transfer_event, erc20_transfer_event, erc721_transfer_event,
    eth_rpc::{Chain, EthRpcClient},
    log_sync_engine::CHUNK_SIZE,
    rocksdb_key::{KeyType, RocksDbKey},
    synched_chunks_iterator::SynchedChunksIterator,
    BlockNum, ChainId, ChunkNum, ERC1155TransferBatchEvent, ERC1155TransferSingleEvent,
    ERC20TransferEvent, ERC721TransferEvent, Error, GroupType,
};
use crate::{Address, ContractId, EventId};
use alloy_json_abi::Function;
use merkle_tree::ark_ff::PrimeField;
use merkle_tree::ark_secp256k1::Fq;
use num_bigint::BigUint;
use prost::Message;
use rocksdb::DB;
use serde_json::Value;
use sha3::Digest;
use sha3::Keccak256;
use std::{env, fs::File, io::Cursor};
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
    let iterator = SynchedChunksIterator::new(rocksdb_client, event_id, contract_id);
    iterator.last()
}

/// Get get the missing chunks in the sync log for a given event and contract.
/// - `to_chunk`: Search for missing chunks up to this chunk number
pub fn search_missing_chunks(
    rocksdb_client: &DB,
    event_id: EventId,
    contract_id: ContractId,
    to_chunk: ChunkNum,
) -> Vec<ChunkNum> {
    let mut missing_chunks = vec![];
    let mut key = RocksDbKey::new_start_key(KeyType::SyncLog, event_id, contract_id);

    for expected_chunk_num in 0..to_chunk {
        key.chunk_num = Some(expected_chunk_num);
        let item = rocksdb_client.get_pinned(key.to_bytes()).unwrap();
        if item.is_none() {
            missing_chunks.push(expected_chunk_num);
        }
    }

    missing_chunks
}

/// Check if there are any missing chunks in the sync log for a given event and contract
pub fn missing_chunk_exists(
    db: &DB,
    event_id: EventId,
    contract_id: ContractId,
    latest_chunk: ChunkNum,
) -> bool {
    let missing_chunks = search_missing_chunks(db, event_id, contract_id, latest_chunk);
    !missing_chunks.is_empty()
}

pub fn get_contract_total_chunks(latest_block: BlockNum, contract: &Contract) -> u64 {
    f64::ceil(((latest_block - contract.deployed_block) as f64) / CHUNK_SIZE as f64) as u64
}

pub async fn is_event_logs_ready(
    db: &DB,
    eth_client: &EthRpcClient,
    event_id: EventId,
    contract: &Contract,
) -> Result<bool, Error> {
    let block_num = eth_client.get_block_number(contract.chain).await?;

    let total_chunks = get_contract_total_chunks(block_num, contract);

    let max_synched_chunk = get_latest_synched_chunk(db, event_id, contract.id);

    let max_synched_chunk = match max_synched_chunk {
        Some(max_synched_chunk) => max_synched_chunk,
        None => return Ok(false),
    };

    let missing_chunk_exists = missing_chunk_exists(db, event_id, contract.id, total_chunks - 1);

    if (total_chunks - 1) == max_synched_chunk && !missing_chunk_exists {
        Ok(true)
    } else {
        Ok(false)
    }
}

pub fn is_block_timestamps_ready(db: &DB, event_id: EventId, contract: &Contract) -> bool {
    let chain_id = get_chain_id(contract.chain);
    let iterator = ContractEventIterator::new(db, event_id, contract.id, None);

    for (key, _) in iterator {
        let block_num = key.block_num.unwrap();

        let key = RocksDbKey {
            key_type: KeyType::BlockTimestamp,
            event_id: None,
            contract_id: None,
            block_num: Some(block_num),
            log_index: None,
            tx_index: None,
            chunk_num: None,
            chain_id: Some(chain_id),
        };

        if db.get(key.to_bytes()).unwrap().is_none() {
            return false;
        }
    }

    true
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

pub fn count_synched_chunks(rocksdb_conn: &DB, event_id: EventId, contract_id: ContractId) -> i32 {
    let iterator = SynchedChunksIterator::new(rocksdb_conn, event_id, contract_id);
    iterator.count() as i32
}

pub fn count_synched_timestamps(
    rocksdb_conn: &DB,
    chain: Chain,
    to_block: Option<BlockNum>,
) -> i32 {
    let iterator = BlockTimestampIterator::new(rocksdb_conn, chain, to_block);
    iterator.count() as i32
}

pub fn get_group_id(group_type: GroupType, contract_inputs: &[String]) -> String {
    let mut hasher = Keccak256::new();

    // Write group type
    match group_type {
        GroupType::EarlyHolder => {
            hasher.update(b"EarlyHolder");
        }
        GroupType::Whale => {
            hasher.update(b"Whale");
        }
        GroupType::AllHolders => {
            hasher.update(b"AllHolders");
        }
        GroupType::CredddTeam => {
            hasher.update(b"CredddTeam");
        }
        GroupType::Ticker => {
            hasher.update(b"Ticker");
        }
        GroupType::Believer => {
            hasher.update(b"Believer");
        }
        GroupType::BaseSalon => {
            hasher.update(b"BaseSalon");
        }
        GroupType::BlastSalon => {
            hasher.update(b"BlastSalon");
        }
        GroupType::EthSalon => {
            hasher.update(b"EthSalon");
        }
        GroupType::ArbSalon => {
            hasher.update(b"ArbSalon");
        }
        GroupType::OpSalon => {
            hasher.update(b"OpSalon");
        }
        GroupType::FriendBagHolder => {
            hasher.update(b"FriendBagHolder");
        }
        _ => {
            panic!("Unsupported group type {:?}", group_type);
        }
    }

    // Write contract inputs
    for input in contract_inputs {
        hasher.update(input.as_bytes());
    }

    // Read hash digest and consume hasher
    let result = hasher.finalize();

    hex::encode(result)
}

pub fn get_chain_id(chain: Chain) -> ChainId {
    match chain {
        Chain::Mainnet => 1,
        Chain::Base => 8453,
        Chain::Arbitrum => 42161,
        Chain::Optimism => 10,
        Chain::Blast => 8145, // The actual chain id is 81457, but we use 8145 so it can fit in a u16
    }
}

pub async fn get_balance_at_block(
    eth_client: &EthRpcClient,
    contract: &Contract,
    address: &str,
    block_number: BlockNum,
) -> BigUint {
    let balance_of_selector = hex::encode(
        Function::parse("balanceOf(address _owner)")
            .unwrap()
            .selector()
            .0,
    );

    let args = hex::decode(format!("{:0>width$}", address, width = 64)).unwrap();

    let balance_at_block = eth_client
        .eth_call(
            contract.chain,
            &contract.address,
            &balance_of_selector,
            &args,
            block_number,
        )
        .await
        .unwrap();

    BigUint::from_bytes_be(
        &hex::decode(
            balance_at_block["result"]
                .as_str()
                .unwrap()
                .trim_start_matches("0x"),
        )
        .unwrap(),
    )
}

pub async fn get_total_supply_at_block(
    eth_client: &EthRpcClient,
    contract: &Contract,
    block_number: BlockNum,
) -> BigUint {
    let total_supply_selector = hex::encode(Function::parse("totalSupply()").unwrap().selector().0);

    let total_supply_at_block = eth_client
        .eth_call(
            contract.chain,
            &contract.address,
            &total_supply_selector,
            &[],
            block_number,
        )
        .await
        .unwrap();

    BigUint::from_bytes_be(
        &hex::decode(
            total_supply_at_block["result"]
                .as_str()
                .unwrap()
                .trim_start_matches("0x"),
        )
        .unwrap(),
    )
}

pub fn to_hex(fe: Fq) -> String {
    format!("0x{}", BigUint::from(fe.into_bigint()).to_str_radix(16))
}

/// Format an address to a 66 character hex string
pub fn format_address(address: &str) -> String {
    format!(
        "0x{:0>width$}",
        address.trim_start_matches("0x"),
        width = 64
    )
}

/// Get a list of addresses from a CSV file
pub fn get_members_from_csv(file_path: &str) -> Vec<Address> {
    let file = File::open(file_path).unwrap();

    // Build the CSV reader and iterate over each record.
    let mut rdr = csv::Reader::from_reader(file);

    let mut addresses = rdr
        .records()
        .map(|record| {
            let record = record.unwrap();
            let address = record.get(0).unwrap().to_string();

            hex::decode(address.trim_start_matches("0x"))
                .unwrap()
                .try_into()
                .unwrap()
        })
        .collect::<Vec<Address>>();

    addresses.sort();

    addresses
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::{test_utils::delete_all, utils::dotenv_config, ROCKSDB_PATH};
    use rocksdb::{Options, DB};

    #[test]
    fn test_search_missing_chunks() {
        dotenv_config();

        // Use a different path for the test db to avoid conflicts with the main db
        const TEST_ROCKSDB_PATH: &str = "test_search_missing_chunks";

        let mut rocksdb_options = Options::default();
        rocksdb_options.create_if_missing(true);

        let rocksdb_conn = DB::open(
            &rocksdb_options,
            format!("{}/{}", ROCKSDB_PATH, TEST_ROCKSDB_PATH),
        )
        .unwrap();

        // Delete all records from the test db
        delete_all(&rocksdb_conn);

        let event_id = 1;
        let contract_id = 1;
        let to_chunk = 30;

        // Case 1.  When there are no records in the sync log
        let missing_chunks = search_missing_chunks(&rocksdb_conn, event_id, contract_id, to_chunk);
        let expected_missing_chunks: Vec<ChunkNum> = (0..to_chunk).collect();
        assert_eq!(expected_missing_chunks, missing_chunks);

        // Case 2. When there are some records up to chunk 9
        for i in 0..10 {
            let key = RocksDbKey {
                key_type: KeyType::SyncLog,
                event_id: Some(event_id),
                contract_id: Some(contract_id),
                chunk_num: Some(i),
                block_num: None,
                log_index: None,
                tx_index: None,
                chain_id: None,
            };

            rocksdb_conn.put(key.to_bytes(), [1]).unwrap();
        }

        let missing_chunks = search_missing_chunks(&rocksdb_conn, event_id, contract_id, to_chunk);
        let expected_missing_chunks: Vec<ChunkNum> = (10..to_chunk).collect();
        assert_eq!(expected_missing_chunks, missing_chunks);

        // Reset the db
        delete_all(&rocksdb_conn);

        // Case 3. When there are records from chunk 3 to 15
        for i in 3..16 {
            let key = RocksDbKey {
                key_type: KeyType::SyncLog,
                event_id: Some(event_id),
                contract_id: Some(contract_id),
                chunk_num: Some(i),
                block_num: None,
                log_index: None,
                tx_index: None,
                chain_id: None,
            };

            rocksdb_conn.put(key.to_bytes(), [1]).unwrap();
        }

        let missing_chunks = search_missing_chunks(&rocksdb_conn, event_id, contract_id, to_chunk);
        let expected_missing_chunks: Vec<ChunkNum> = (0..3).chain(16..to_chunk).collect();
        assert_eq!(expected_missing_chunks, missing_chunks);

        delete_all(&rocksdb_conn);
    }
}
