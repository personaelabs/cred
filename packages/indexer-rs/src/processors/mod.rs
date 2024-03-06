#![allow(async_fn_in_trait)]
use crate::TransferEvent;
pub mod early_holders;
pub mod whales;

/// A trait for a group indexer
pub trait GroupIndexer {
    /// Initializes the group
    async fn init_group(&mut self) -> Result<(), tokio_postgres::Error>;
    /// Processes a log and updates the indexer's state
    fn process_log(&mut self, log: &TransferEvent) -> Result<(), std::io::Error>;
    /// Save a Merkle tree for the current state of the indexer
    async fn save_tree(&self, block_number: i64) -> Result<(), tokio_postgres::Error>;
}

/// Upsert a group
pub async fn upsert_group(
    pg_client: &tokio_postgres::Client
    ,
    display_name: &String,
    handle: &String,
) -> Result<i32, tokio_postgres::Error> {
    let result = 
            pg_client
            .query_one(
                r#"
            INSERT INTO "Group" ("displayName", "handle", "type", "updatedAt") VALUES ($1, $2, 'early-holder', NOW())
            ON CONFLICT ("handle") DO UPDATE SET "displayName" = $1
            RETURNING id
        "#,
                &[&display_name, &handle],
            )
            .await?;

    Ok(result.get(0))
}