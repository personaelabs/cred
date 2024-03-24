use crate::{
    eth_rpc::EthRpcClient, processors::GroupIndexer, tree::save_tree, BlockNum, Error, GroupType,
};
use log::{error, info};
use std::sync::Arc;
use tokio::sync::Semaphore;

const INDEXING_INTERVAL_SECS: u64 = 60; // 60 seconds

pub struct TreeSyncEngine {
    pub indexer: Box<dyn GroupIndexer>,
    pub group_id: i32,
    pub pg_client: Arc<tokio_postgres::Client>,
    pub rocksdb_client: Arc<rocksdb::DB>,
    pub eth_client: Arc<EthRpcClient>,
    pub semaphore: Arc<Semaphore>,
}

impl TreeSyncEngine {
    pub fn new(
        indexer: Box<dyn GroupIndexer>,
        group_id: i32,
        pg_client: Arc<tokio_postgres::Client>,
        rocksdb_client: Arc<rocksdb::DB>,
        eth_client: Arc<EthRpcClient>,
        semaphore: Arc<Semaphore>,
    ) -> Self {
        TreeSyncEngine {
            indexer,
            group_id,
            pg_client,
            rocksdb_client,
            eth_client,
            semaphore,
        }
    }
}

impl TreeSyncEngine {
    /// Sync the tree to a specific block number
    async fn sync_to_block(&self, block_number: BlockNum) -> Result<(), Error> {
        let members = self.indexer.get_members(block_number)?;

        save_tree(
            self.group_id,
            GroupType::EarlyHolder,
            &self.pg_client,
            members.iter().copied().collect(),
            block_number as i64,
        )
        .await?;

        Ok(())
    }

    /// Start the sync job
    pub async fn sync(&self) {
        loop {
            let permit = self.semaphore.acquire().await;

            if permit.is_err() {
                error!("${} Semaphore acquire error: {:?}", self.group_id, permit);
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                continue;
            }

            let permit = permit.unwrap();

            // Check if the indexer is ready or not

            let is_ready = self.indexer.is_ready().await;

            if is_ready.is_err() {
                drop(permit);
                error!(
                    "${} Error checking if indexer is ready: {:?}",
                    self.group_id,
                    is_ready.err().unwrap()
                );
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                continue;
            }

            if !is_ready.unwrap() {
                drop(permit);
                info!("${} Waiting for the indexer...", self.group_id);
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                continue;
            }

            // Get the latest block number
            let latest_block = self.eth_client.get_block_number(self.indexer.chain()).await;

            if latest_block.is_err() {
                drop(permit);
                error!(
                    "${} get_block_number Error: {:?}",
                    self.group_id,
                    latest_block.err().unwrap()
                );
                tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                continue;
            }

            let latest_block = latest_block.unwrap();

            // Sync to the latest block
            let sync_to_block_result = self.sync_to_block(latest_block).await;

            match sync_to_block_result {
                Ok(_) => {
                    info!("${} Tree synced to block {}", self.group_id, latest_block);
                }
                Err(err) => {
                    error!(
                        "${} Error syncing to block {}: {:?}",
                        self.group_id, latest_block, err
                    );
                }
            }

            drop(permit);

            tokio::time::sleep(std::time::Duration::from_secs(INDEXING_INTERVAL_SECS)).await;
        }
    }
}
