pub mod get_address_groups;
pub mod get_creddd;
pub mod get_group_by_merkle_root;
pub mod get_latest_merkle_trees;
pub mod get_group_latest_merkle_tree;
pub mod get_group_merkle_tree;
pub mod get_groups;
use serde::{Deserialize, Serialize};

use crate::GroupType;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupData {
    pub id: String,
    pub display_name: String,
    pub type_id: GroupType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerkleTree {
    id: i32,
    bloom_filter: Vec<u8>,
    bloom_sip_keys: Vec<Vec<u8>>,
    bloom_num_hashes: i32,
    bloom_num_bits: i32,
    group: GroupData,
}
