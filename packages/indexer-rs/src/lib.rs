use num_bigint::BigUint;

pub mod contract;
pub mod eth_rpc;
pub mod log_sync_engine;
pub mod logger;
pub mod processors;
pub mod rocksdb_key;
pub mod tree;
pub mod utils;

pub const ROCKSDB_PATH: &str = "./db";

#[derive(Debug, Clone)]
pub struct TransferEvent {
    pub from: [u8; 20],
    pub to: [u8; 20],
    pub value: BigUint,
}

pub mod transfer_event {
    include!(concat!(env!("OUT_DIR"), "/transfer_event.rs"));
}

pub mod merkle_proof {
    include!(concat!(env!("OUT_DIR"), "/merkle_proof.rs"));
}

pub mod merkle_tree_proto {
    include!(concat!(env!("OUT_DIR"), "/merkle_tree_proto.rs"));
}
