use eth_rpc::Chain;
use num_bigint::BigUint;

pub mod contracts;
pub mod eth_rpc;
pub mod processors;
pub mod tree;
pub mod utils;

pub const ROCKSDB_PATH: &str = "./db";

#[derive(Debug, Clone)]
pub struct Contract {
    pub id: i32,
    pub address: String,
    pub chain: Chain,
    pub name: String,
    pub symbol: String,
    pub deployed_block: i64,
}

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
