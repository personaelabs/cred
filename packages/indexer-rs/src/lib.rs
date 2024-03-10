use num_bigint::BigUint;

pub mod contract;
pub mod eth_rpc;
pub mod event;
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

pub mod erc20_transfer_event {
    include!(concat!(env!("OUT_DIR"), "/erc20_transfer_event.rs"));
}

pub mod erc721_transfer_event {
    include!(concat!(env!("OUT_DIR"), "/erc721_transfer_event.rs"));
}

pub mod merkle_proof {
    include!(concat!(env!("OUT_DIR"), "/merkle_proof.rs"));
}

pub mod merkle_tree_proto {
    include!(concat!(env!("OUT_DIR"), "/merkle_tree_proto.rs"));
}
