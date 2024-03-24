#![allow(async_fn_in_trait)]

use std::collections::HashSet;
use std::io::Error;
use std::sync::Arc;
use crate::eth_rpc::{Chain, EthRpcClient};
use crate::{Address, BlockNum, GroupType};

pub mod early_holders;
pub mod all_holders;
pub mod whales;
pub mod ticker;

pub const SYNC_WINDOW_SECS: u64 = 60; // 60 seconds

#[async_trait::async_trait]
/// A trait for a group indexer
pub trait GroupIndexer: Send + Sync {
    /// Returns the group id
    /// TODO: Return the `Group` struct once the indexer is refactored to hold it.
    fn group_id(&self) -> i32;
    /// Returns the chain the logs the indexer depends on are on
    fn chain(&self) -> Chain;
    /// Returns true if the logs which the indexer depends on are ready
    async fn is_ready(&self) -> Result<bool, surf::Error> ;
    /// Return all members
    fn get_members(&self, block_number: BlockNum) -> Result<HashSet<Address>, Error>;
}

#[derive(Clone)]
pub struct IndexerResources {
    pub pg_client:Arc<tokio_postgres::Client>,
    pub rocksdb_client: Arc<rocksdb::DB>,
    pub eth_client: Arc<EthRpcClient>,
}

/// Upsert a group
pub async fn upsert_group(
    pg_client: &tokio_postgres::Client,
    display_name: &String,
    handle: &String,
    group_type: GroupType,
) -> Result<i32, tokio_postgres::Error> {
    let result = 
            pg_client
            .query_one(
                r#"
            INSERT INTO "Group" ("displayName", "handle", "typeId", "updatedAt") VALUES ($1, $2, $3, NOW())
            ON CONFLICT ("handle") DO UPDATE SET "displayName" = $1, "updatedAt" = NOW(), "typeId" = $3
            RETURNING id
        "#,
                &[&display_name, &handle, &group_type],
            )
            .await?;

    Ok(result.get(0))
}