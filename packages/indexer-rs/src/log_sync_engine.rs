use crate::block_timestamp_sync_engine::BlockTimestampSyncEngine;
use crate::contract::Contract;
use crate::eth_rpc::EthRpcClient;
use crate::events::erc1155_batch::ERC1155TransferBatchLog;
use crate::events::erc1155_single::ERC1155TransferSingleLog;
use crate::events::erc20::ERC20TransferLog;
use crate::events::erc721::ERC721TransferLog;
use crate::events::EventLogLike;
use crate::rocksdb_key::{
    KeyType, RocksDbKey, ERC1155_TRANSFER_BATCH_EVENT_ID, ERC1155_TRANSFER_SINGLE_EVENT_ID,
    ERC20_TRANSFER_EVENT_ID, ERC721_TRANSFER_EVENT_ID,
};
use crate::utils::{get_latest_synched_chunk, search_missing_chunks};
use crate::{BlockNum, ChunkNum, EventId};
use colored::*;
use core::panic;
use futures::future::join_all;
use log::{error, info};
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use rocksdb::WriteBatch;
use serde_json::Value;
use std::cmp::min;
use std::sync::Arc;

pub const CHUNK_SIZE: u64 = 2000;

pub const TRANSFER_EVENT_SIG: &str =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

pub const ERC1155_TRANSFER_BATCH_SIG: &str =
    "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb";

pub const ERC1155_TRANSFER_SINGLE_SIG: &str =
    "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62";

/// A struct to sync all logs of a particular contract event
pub struct LogSyncEngine {
    eth_client: Arc<EthRpcClient>,
    contract: Contract,
    event_id: EventId,
    event_sig: &'static str,
    rocksdb_client: Arc<rocksdb::DB>,
    block_timestamp_sync_engine: BlockTimestampSyncEngine,
}

impl LogSyncEngine {
    pub fn new(
        eth_client: Arc<EthRpcClient>,
        contract: Contract,
        event_id: EventId,
        rocksdb_client: Arc<rocksdb::DB>,
    ) -> Self {
        // Determine the event signature from the event_id
        let event_sig = match event_id {
            ERC20_TRANSFER_EVENT_ID => TRANSFER_EVENT_SIG,
            ERC721_TRANSFER_EVENT_ID => TRANSFER_EVENT_SIG,
            ERC1155_TRANSFER_SINGLE_EVENT_ID => ERC1155_TRANSFER_SINGLE_SIG,
            ERC1155_TRANSFER_BATCH_EVENT_ID => ERC1155_TRANSFER_BATCH_SIG,
            _ => panic!("Invalid event_id"),
        };

        let block_timestamp_sync_engine: BlockTimestampSyncEngine = BlockTimestampSyncEngine::new(
            eth_client.clone(),
            rocksdb_client.clone(),
            contract.chain,
            event_id,
            contract.id,
        );

        Self {
            eth_client,
            contract,
            event_id,
            event_sig,
            rocksdb_client,
            block_timestamp_sync_engine,
        }
    }

    /// Search for chunks (i.e. block ranges) that aren't synched yet
    fn search_missing_chunks(&self, to_chunk: ChunkNum) -> Vec<ChunkNum> {
        let missing_chunks = search_missing_chunks(
            &self.rocksdb_client,
            self.event_id,
            self.contract.id,
            to_chunk,
        );

        missing_chunks
    }

    /// Save batch of logs to RocksDB
    fn save_logs_batch(&self, logs_batch: Vec<Vec<Value>>) {
        // Initialize the batch writer
        let mut batch = WriteBatch::default();

        // Convert the logs to RocksDB records of the form (key, value)
        let parsed_logs: Vec<(Vec<u8>, Vec<u8>)> = logs_batch
            .par_iter()
            .flat_map(|logs_batch| {
                logs_batch.par_iter().map(|log| {
                    let contract_id = self.contract.id;
                    let event_log: Box<dyn EventLogLike> = match self.event_id {
                        ERC20_TRANSFER_EVENT_ID => {
                            Box::new(ERC20TransferLog::from_json(log, contract_id))
                        }
                        ERC721_TRANSFER_EVENT_ID => {
                            Box::new(ERC721TransferLog::from_json(log, contract_id))
                        }
                        ERC1155_TRANSFER_SINGLE_EVENT_ID => {
                            Box::new(ERC1155TransferSingleLog::from_json(log, contract_id))
                        }
                        ERC1155_TRANSFER_BATCH_EVENT_ID => {
                            Box::new(ERC1155TransferBatchLog::from_json(log, contract_id))
                        }
                        _ => panic!("Invalid event_id"),
                    };

                    let (key, value) = event_log.to_rocksdb_record();
                    (key.to_bytes(), value)
                })
            })
            .collect();

        for (key, value) in parsed_logs {
            batch.put(&key, &value);
        }

        // Write the batch to RocksDB
        self.rocksdb_client.write(batch).unwrap();
    }

    /// Get the latest saved chunk
    pub fn get_latest_synched_chunk(&self) -> Option<ChunkNum> {
        get_latest_synched_chunk(&self.rocksdb_client, self.event_id, self.contract.id)
    }

    /// Fetch and save logs in the given chunks (i.e. block ranges)
    async fn sync_chunks(&self, chunks: Vec<ChunkNum>, latest_block: BlockNum) {
        // Block ranges to fetch logs.
        // We use batch requests to fetch logs in parallel.
        let mut block_ranges = vec![];

        for chunk in &chunks {
            let chunk_from = min(
                self.contract.deployed_block + chunk * CHUNK_SIZE,
                latest_block,
            );
            let chunk_to = min(chunk_from + CHUNK_SIZE, latest_block);

            block_ranges.push([chunk_from, chunk_to]);

            if chunk_to == latest_block {
                break;
            }
        }

        let mut batch_size = block_ranges.len();
        while !block_ranges.is_empty() {
            batch_size = min(batch_size, block_ranges.len());
            let batch = block_ranges[..batch_size].to_vec();

            let result = self
                .eth_client
                .get_logs_batch(
                    self.contract.chain,
                    &self.contract.address,
                    self.event_sig,
                    &batch,
                )
                .await;

            match result {
                Ok(result) => {
                    let result = result.as_array();

                    if let Some(result) = result {
                        // Check if any of the batches failed
                        let mut error_msg = None;
                        let needs_retry = result.iter().any(|batch| {
                            let error = batch["error"].to_string();

                            if error == "null" {
                                false
                            } else {
                                error_msg = Some(error);
                                true
                            }
                        });

                        if needs_retry {
                            error!(
                                "${} ({}) {} {:?}",
                                self.contract.name,
                                batch.len(),
                                "Error:".red(),
                                error_msg
                            );
                            // We reduce the number of chunks and retry
                            batch_size /= 4;
                        } else {
                            // Parse the inner results
                            let batches = result
                                .iter()
                                .map(|batch| batch["result"].as_array().unwrap().to_vec())
                                .collect();

                            self.save_logs_batch(batches);

                            // Remove the processed block ranges
                            block_ranges = block_ranges[batch_size..].to_vec();
                        }
                    }
                }
                Err(e) => {
                    error!("${} Error (retrying): {:?}", self.contract.name, e);
                }
            }
        }

        let mut batch = WriteBatch::default();

        let mut sync_log_key = RocksDbKey {
            key_type: KeyType::SyncLog,
            event_id: Some(self.event_id),
            contract_id: Some(self.contract.id),
            block_num: None,
            log_index: None,
            tx_index: None,
            chunk_num: Some(0),
            chain_id: None,
        };

        // Mark chunks as synched
        for chunk in &chunks {
            sync_log_key.chunk_num = Some(*chunk);
            batch.put(sync_log_key.to_bytes(), [1]);
        }

        self.rocksdb_client.write(batch).unwrap();
        if !chunks.is_empty() {
            info!(
                "${} Synched chunk: {}-{}",
                self.contract.name,
                chunks[0],
                chunks[chunks.len() - 1]
            );
        }
    }

    /// Sync contract logs up to the given block number
    pub async fn sync_to_block(&self, to_block: BlockNum) {
        let batch_size = 1;

        // Calculate the total number of chunks to sync
        let num_total_chunks =
            f64::ceil(((to_block - self.contract.deployed_block) as f64) / CHUNK_SIZE as f64)
                as u64;

        // Get the latest synched chunk. We start from the next chunk.
        let chunks_from = self.get_latest_synched_chunk().unwrap_or(0);

        // A chunk is 2000 blocks. We get logs in batches of 50 chunks (100,000 blocks)

        let chunk_batches = (chunks_from..num_total_chunks).collect::<Vec<ChunkNum>>();

        for batch in chunk_batches.chunks(batch_size as usize) {
            self.sync_chunks(batch.to_vec(), to_block).await;
        }

        /*
        let jobs = chunk_batches
            .chunks(batch_size as usize)
            .map(|batch| self.sync_chunks(batch.to_vec(), to_block));

        join_all(jobs).await;
         */

        // Get missing chunks
        let missing_chunks = self.search_missing_chunks(num_total_chunks);

        let missing_chunks_sync_jobs = missing_chunks
            .chunks(batch_size as usize)
            .map(|batch| self.sync_chunks(batch.to_vec(), to_block));

        join_all(missing_chunks_sync_jobs).await;

        info!("${} Synced to block: {}", self.contract.name, to_block);
    }

    pub async fn sync(self) {
        // Start the background sync loop
        loop {
            let latest_block = self.eth_client.get_block_number(self.contract.chain).await;

            if latest_block.is_err() {
                error!(
                    "${} get_block_number Error: {:?}",
                    self.contract.name,
                    latest_block.err().unwrap()
                );
                tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                continue;
            }

            let latest_block = latest_block.unwrap();

            // Sync logs to the latest block
            self.sync_to_block(latest_block).await;

            // Sync block timestamps
            // Only sync block timestamps for the $higher contract for now
            if self.contract.id == 86 {
                self.block_timestamp_sync_engine.sync().await;
            }

            tokio::time::sleep(std::time::Duration::from_secs(60)).await;
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::{
        test_utils::{delete_all, erc20_test_contract, init_test_rocksdb},
        utils::{count_synched_chunks, count_synched_logs, dotenv_config, missing_chunk_exists},
    };

    #[tokio::test]
    async fn test_sync_engine() {
        dotenv_config();

        let rocksdb_conn = init_test_rocksdb("test_sync_engine");
        let eth_client = Arc::new(EthRpcClient::new());

        let contract = erc20_test_contract();

        // Hardcoded to the latest block number at the time of writing this test,
        // so we can hardcode other values as well.
        let to_block = 19473397;

        let contract_sync_engine = LogSyncEngine::new(
            eth_client,
            contract.clone(),
            ERC20_TRANSFER_EVENT_ID,
            rocksdb_conn.clone(),
        );
        contract_sync_engine.sync_to_block(to_block).await;

        // 1. Check that the number of synched logs is equal to the expected count
        let count = count_synched_logs(
            &rocksdb_conn,
            ERC20_TRANSFER_EVENT_ID,
            contract.id,
            Some(to_block),
        );

        let expected_count = 7239;
        assert_eq!(count, expected_count);

        // 2. Check that the latest synched chunk is equal to the expected chunk
        let latest_synched_chunk = contract_sync_engine.get_latest_synched_chunk();
        get_latest_synched_chunk(&rocksdb_conn, ERC20_TRANSFER_EVENT_ID, contract.id);

        let expected_latest_synched_chunk = 466;

        assert_eq!(latest_synched_chunk.unwrap(), expected_latest_synched_chunk);

        // 3. Check the number of synched chunks
        let num_synched_chunks =
            count_synched_chunks(&rocksdb_conn, ERC20_TRANSFER_EVENT_ID, contract.id);
        let expected_num_synched_chunks = expected_latest_synched_chunk + 1;
        assert_eq!(num_synched_chunks, expected_num_synched_chunks as i32);

        // 4. Check that `missing_chunk_exists` returns false
        let missing_chunks_exists = missing_chunk_exists(
            &rocksdb_conn,
            ERC20_TRANSFER_EVENT_ID,
            contract.id,
            expected_latest_synched_chunk,
        );
        assert!(!missing_chunks_exists);

        delete_all(&rocksdb_conn);
    }

    // Test that the sync engine recovers from a state where some chunks are missing
    #[tokio::test]
    async fn test_sync_engine_recovery() {
        dotenv_config();

        let rocksdb_client = init_test_rocksdb("test_sync_engine_recovery");
        let eth_client = Arc::new(EthRpcClient::new());

        let contract = erc20_test_contract();

        // Hardcoded to the latest block number at the time of writing this test,
        // so we can hardcode other values as well.
        let to_block = 19473397;

        let contract_sync_engine = LogSyncEngine::new(
            eth_client,
            contract.clone(),
            ERC20_TRANSFER_EVENT_ID,
            rocksdb_client.clone(),
        );

        // Mark chunks 2~4, 6~8 as synched
        let mut batch = WriteBatch::default();
        for chunk in (2..5).chain(6..9) {
            let sync_log_key = RocksDbKey {
                key_type: KeyType::SyncLog,
                event_id: Some(ERC20_TRANSFER_EVENT_ID),
                contract_id: Some(contract.id),
                block_num: None,
                log_index: None,
                tx_index: None,
                chunk_num: Some(chunk),
                chain_id: None,
            };

            batch.put(sync_log_key.to_bytes(), [1]);
        }

        rocksdb_client.write(batch).unwrap();

        contract_sync_engine.sync_to_block(to_block).await;

        // 1. Check that the latest synched chunk is equal to the expected chunk
        let latest_synched_chunk = contract_sync_engine.get_latest_synched_chunk();
        get_latest_synched_chunk(&rocksdb_client, ERC20_TRANSFER_EVENT_ID, contract.id);

        let expected_latest_synched_chunk = 466;

        assert_eq!(latest_synched_chunk.unwrap(), expected_latest_synched_chunk);

        // 2. Check the number of synched chunks
        let num_synched_chunks =
            count_synched_chunks(&rocksdb_client, ERC20_TRANSFER_EVENT_ID, contract.id);
        let expected_num_synched_chunks = expected_latest_synched_chunk + 1;
        assert_eq!(num_synched_chunks, expected_num_synched_chunks as i32);

        // 3. Check that there are no missing chunks
        let missing_chunks_exists = missing_chunk_exists(
            &rocksdb_client,
            ERC20_TRANSFER_EVENT_ID,
            contract.id,
            expected_latest_synched_chunk,
        );
        assert!(!missing_chunks_exists);

        delete_all(&rocksdb_client);
    }
}
