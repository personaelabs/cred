use num_bigint::BigUint;

pub mod address_groups;
pub mod block_timestamp_iterator;
pub mod block_timestamp_sync_engine;
pub mod coingecko;
pub mod contract;
pub mod contract_event_iterator;
pub mod eth_rpc;
pub mod events;
pub mod group;
pub mod intrinsic_creddd_sync_engine;
pub mod log_sync_engine;
pub mod neynar;
pub mod postgres;
pub mod processors;
pub mod rocksdb_key;
pub mod seeder;
pub mod server;
pub mod status_logger;
pub mod synched_chunks_iterator;
pub mod tree;
pub mod tree_sync_engine;
pub mod utils;

#[cfg(test)]
pub mod test_utils;

use postgres_types::{FromSql, ToSql};
use serde::{Deserialize, Serialize};

// Define the types for the RocksDB key and value

/// ID of a contract event
pub type EventId = u16;

/// Contract id defined in the Postgres database
pub type ContractId = u16;

pub type GroupId = String;

pub type TreeId = i32;

/// A chunk number is a number that represents a range of 2000 blocks.
/// It's counted from the block the contract was deployed. (Chunk numbers are contract specific)
pub type ChunkNum = u64;

/// Block number
pub type BlockNum = u64;

/// Index of a log in a block
pub type LogIndex = u32;

/// Index of a transaction in a block
pub type TxIndex = u32;

/// Chain ID
pub type ChainId = u16;

pub type Fid = i64;

/// 20byte Ethereum address
pub type Address = [u8; 20];

pub const ROCKSDB_PATH: &str = "./db";

#[derive(Debug)]
pub enum IndexerError {
    InvalidBalance,
    NoBlockTimestamp,
}

#[derive(Debug)]
pub struct EthRpcError {
    pub message: String,
}

#[derive(Debug)]
pub enum Error {
    RocksDB(rocksdb::Error),
    Postgres(tokio_postgres::Error),
    Surf(surf::Error),
    Indexer(IndexerError),
    EthRpc(EthRpcError),
}

impl From<rocksdb::Error> for Error {
    fn from(e: rocksdb::Error) -> Self {
        Error::RocksDB(e)
    }
}

impl From<tokio_postgres::Error> for Error {
    fn from(e: tokio_postgres::Error) -> Self {
        Error::Postgres(e)
    }
}

impl From<surf::Error> for Error {
    fn from(e: surf::Error) -> Self {
        Error::Surf(e)
    }
}

impl From<IndexerError> for Error {
    fn from(e: IndexerError) -> Self {
        Error::Indexer(e)
    }
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, FromSql, ToSql, Serialize, Deserialize)]
#[postgres(name = "GroupType")]
pub enum GroupType {
    Static,
    CredddTeam,
    BaseSalon,
    BlastSalon,
    EthSalon,
    ArbSalon,
    OpSalon,
    EarlyHolder,
    Whale,
    AllHolders,
    Ticker,
    Believer,
    FriendBagHolder,
    Farcaster1K,
    Farcaster10K,
    Farcaster100K,
    FarcasterPowerUsers
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, FromSql, ToSql, Serialize, Deserialize)]
#[postgres(name = "GroupState")]
pub enum GroupState {
    Recordable,
    Unrecordable,
    Invalid,
}

#[derive(Debug, Clone)]
pub struct ERC20TransferEvent {
    pub from: Address,
    pub to: Address,
    pub value: BigUint,
}

#[derive(Debug, Clone)]
pub struct ERC721TransferEvent {
    pub from: Address,
    pub to: Address,
    pub token_id: BigUint,
}

#[derive(Debug, Clone)]
pub struct ERC1155TransferSingleEvent {
    pub from: Address,
    pub to: Address,
    pub id: BigUint,
}

#[derive(Debug, Clone)]
pub struct ERC1155TransferBatchEvent {
    pub from: Address,
    pub to: Address,
    pub ids: Vec<BigUint>,
    pub values: Vec<BigUint>,
}

pub mod erc20_transfer_event {
    include!(concat!(env!("OUT_DIR"), "/erc20_transfer_event.rs"));
}

pub mod erc721_transfer_event {
    include!(concat!(env!("OUT_DIR"), "/erc721_transfer_event.rs"));
}

pub mod erc1155_transfer_event {
    include!(concat!(env!("OUT_DIR"), "/erc1155_transfer_event.rs"));
}

pub mod merkle_tree_proto {
    include!(concat!(env!("OUT_DIR"), "/merkle_tree_proto.rs"));
}
