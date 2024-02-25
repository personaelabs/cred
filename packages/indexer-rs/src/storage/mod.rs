#![allow(async_fn_in_trait)]
pub mod postgres;
use std::fmt::Debug;

#[derive(Debug, Clone)]
pub struct Contract {
    pub id: i32,
    pub name: String,
    pub symbol: String,
    pub target_groups: Vec<String>,
}

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

pub struct Group {
    pub id: i32,
    pub handle: String,
    pub display_name: String,
}

pub struct GroupUpsertData {
    pub display_name: String,
}

pub trait Storage {
    type ErrorType: Debug;

    async fn get_group_by_handle(&self, handle: &str) -> Result<Option<Group>, Self::ErrorType>;
    async fn get_contracts(&self) -> Result<Vec<Contract>, Self::ErrorType>;
    async fn update_group_merkle_tree(&self, tree: GroupMerkleTree) -> Result<(), Self::ErrorType>;
    async fn create_group_merkle_tree(
        &self,
        tree: GroupMerkleTreeWithProofs,
    ) -> Result<i32, Self::ErrorType>;
    async fn get_latest_group_merkle_tree(
        &self,
        group_id: i32,
    ) -> Result<Option<GroupMerkleTree>, Self::ErrorType>;
    async fn get_tree_by_root_and_group(
        &self,
        merkle_root: &str,
        group_id: i32,
    ) -> Result<Option<GroupMerkleTree>, Self::ErrorType>;
    async fn upsert_group(
        &self,
        handle: String,
        data: GroupUpsertData,
    ) -> Result<(), Self::ErrorType>;
}
