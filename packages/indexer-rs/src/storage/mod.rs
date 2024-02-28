#![allow(async_fn_in_trait)]
pub mod postgres;
use std::fmt::Debug;

/// `Contract` represents a smart contract on the Ethereum blockchain
#[derive(Debug, Clone)]
pub struct Contract {
    pub id: i32,
    pub name: String,
    pub symbol: String,
    pub target_groups: Vec<String>,
}

// `Group` represents a group of Ethereum addresses
// (i.e. `Group` represents an anonymity set)
pub struct Group {
    pub id: i32,
    pub handle: String,
    pub display_name: String,
}

/// `GroupMerkleTree` represents a Merkle tree that consists of members of a `Group`
pub struct GroupMerkleTree {
    pub merkle_root: String,
    pub group_id: i32,
    pub block_number: i64,
}

pub struct GroupMerkleTreeWithProofs {
    pub merkle_root: String,
    pub group_id: i32,
    pub block_number: i64,
    pub proofs: Vec<Vec<u8>>,
}

pub struct GroupUpsertData {
    pub display_name: String,
}

/// `Storage` is a trait that represents a storage backend
/// that stores `Contract`, `Group`, and `GroupMerkleTree` objects
pub trait Storage {
    type ErrorType: Debug;

    /// Get the `Group` object by group handle
    async fn get_group_by_handle(&self, handle: &str) -> Result<Option<Group>, Self::ErrorType>;
    /// Get all contracts stored in storage
    async fn get_contracts(&self) -> Result<Vec<Contract>, Self::ErrorType>;
    /// Update the group merkle tree in storage
    async fn update_group_merkle_tree(&self, tree: GroupMerkleTree) -> Result<(), Self::ErrorType>;
    // Save a new group merkle tree with proofs
    async fn save_group_merkle_tree(
        &self,
        tree: GroupMerkleTreeWithProofs,
    ) -> Result<i32, Self::ErrorType>;
    /// Get the latest group merkle tree by id from storage
    async fn get_latest_group_merkle_tree(
        &self,
        group_id: i32,
    ) -> Result<Option<GroupMerkleTree>, Self::ErrorType>;
    async fn get_tree_by_root_and_group(
        &self,
        merkle_root: &str,
        group_id: i32,
    ) -> Result<Option<GroupMerkleTree>, Self::ErrorType>;
    // Upsert a `Group` in storage
    async fn upsert_group(
        &self,
        handle: String,
        data: GroupUpsertData,
    ) -> Result<(), Self::ErrorType>;
}
