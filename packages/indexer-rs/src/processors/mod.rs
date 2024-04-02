#![allow(async_fn_in_trait)]

use crate::eth_rpc::{Chain, EthRpcClient};
use crate::group::Group;
use crate::{Address, BlockNum, Error};
use std::collections::HashSet;
use std::sync::Arc;

pub mod all_holders;
pub mod believer;
pub mod creddd_team;
pub mod early_holders;
pub mod ticker;
pub mod whales;

pub const SYNC_WINDOW_SECS: u64 = 60; // 60 seconds

#[async_trait::async_trait]
/// A trait for a group indexer
pub trait GroupIndexer: Send + Sync {
    /// Returns the reference to the group
    fn group(&self) -> &Group;
    /// Returns the chain the logs the indexer depends on are on
    fn chain(&self) -> Chain;
    /// Returns true if the logs which the indexer depends on are ready
    async fn is_ready(&self) -> Result<bool, surf::Error>;
    /// Return all members
    async fn get_members(&self, block_number: BlockNum) -> Result<HashSet<Address>, Error>;
    /// Sanity check that the given members are eligible to be in the group
    async fn sanity_check_members(
        &self,
        members: &[Address],
        block_number: BlockNum,
    ) -> Result<bool, Error>;
}

#[derive(Clone)]
pub struct IndexerResources {
    pub pg_client: Arc<tokio_postgres::Client>,
    pub rocksdb_client: Arc<rocksdb::DB>,
    pub eth_client: Arc<EthRpcClient>,
}
