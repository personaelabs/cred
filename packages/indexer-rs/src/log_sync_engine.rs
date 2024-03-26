use crate::contract::{Contract, ContractType};
use crate::eth_rpc::EthRpcClient;
use crate::event::{
    event_log_to_key_value, parse_erc1155_transfer_batch_event_log,
    parse_erc1155_transfer_single_event_log, parse_erc20_event_log, parse_erc721_event_log,
    parse_punk_transfer_event_log,
};
use crate::rocksdb_key::{
    KeyType, RocksDbKey, ERC1155_TRANSFER_BATCH_EVENT_ID, ERC1155_TRANSFER_SINGLE_EVENT_ID,
    ERC20_TRANSFER_EVENT_ID, ERC721_TRANSFER_EVENT_ID,
};
use crate::utils::get_latest_synched_chunk;
use crate::{BlockNum, ChunkNum, EventId};
use colored::*;
use core::panic;
use futures::future::join_all;
use log::{debug, error, info};
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use rocksdb::{IteratorMode, WriteBatch};
use serde_json::Value;
use std::cmp::min;
use std::sync::Arc;
use std::time::Instant;

pub const CHUNK_SIZE: u64 = 2000;

const TRANSFER_EVENT_SIG: &str =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const ERC1155_TRANSFER_BATCH_SIG: &str =
    "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb";

const ERC1155_TRANSFER_SINGLE_SIG: &str =
    "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62";

/// A struct to sync all logs of a particular contract event
pub struct LogSyncEngine {
    eth_client: Arc<EthRpcClient>,
    contract: Contract,
    event_id: EventId,
    event_sig: &'static str,
    rocksdb_client: Arc<rocksdb::DB>,
    log_parser: fn(&Value) -> Vec<u8>,
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

        // Select the log parser based on the contract type and event_id
        let log_parser = match (contract.contract_type, event_id) {
            (ContractType::ERC20, ERC20_TRANSFER_EVENT_ID) => parse_erc20_event_log,
            (ContractType::ERC721, ERC721_TRANSFER_EVENT_ID) => parse_erc721_event_log,
            (ContractType::Punk, ERC721_TRANSFER_EVENT_ID) => parse_punk_transfer_event_log,
            (ContractType::ERC1155, ERC1155_TRANSFER_SINGLE_EVENT_ID) => {
                parse_erc1155_transfer_single_event_log
            }
            (ContractType::ERC1155, ERC1155_TRANSFER_BATCH_EVENT_ID) => {
                parse_erc1155_transfer_batch_event_log
            }
            _ => panic!("Invalid contract type and event_id combination"),
        };

        Self {
            eth_client,
            contract,
            event_id,
            event_sig,
            rocksdb_client,
            log_parser,
        }
    }

    /// Search for chunks that aren't synched yet
    fn search_missing_chunks(&self, to_chunk: ChunkNum) -> Vec<ChunkNum> {
        let start_key =
            RocksDbKey::new_start_key(KeyType::SyncLog, self.event_id, self.contract.id);

        let iterator = self.rocksdb_client.iterator(IteratorMode::From(
            &start_key.to_bytes(),
            rocksdb::Direction::Forward,
        ));

        let mut missing_chunks = vec![];

        for (expected_chunk_num, item) in iterator.enumerate() {
            let (key_bytes, _value) = item.unwrap();

            let key = RocksDbKey::from_bytes(key_bytes.as_ref().try_into().unwrap());

            if key.key_type != KeyType::SyncLog
                || key.event_id != self.event_id
                || key.contract_id != self.contract.id
            {
                break;
            }

            if expected_chunk_num as ChunkNum > to_chunk {
                break;
            }

            if key.chunk_num.unwrap() != expected_chunk_num as ChunkNum {
                missing_chunks.push(expected_chunk_num as ChunkNum);
            }
        }

        missing_chunks
    }

    /// Save batch of logs to RocksDB
    fn save_logs_batch(&self, logs_batch: Vec<Vec<Value>>) {
        let mut batch = WriteBatch::default();

        let parsed_logs: Vec<(Vec<u8>, Vec<u8>)> = logs_batch
            .par_iter()
            .flat_map(|logs_batch| {
                logs_batch.par_iter().map(|log| {
                    let (key, event) = event_log_to_key_value(
                        log,
                        self.event_id,
                        self.contract.id,
                        self.log_parser,
                    );

                    (key.to_bytes().to_vec(), event)
                })
            })
            .collect();

        for (key, value) in parsed_logs {
            batch.put(&key, &value);
        }

        self.rocksdb_client.write(batch).unwrap();
    }

    /// Get the latest synched chunk
    pub fn get_latest_synched_chunk(&self) -> Option<ChunkNum> {
        get_latest_synched_chunk(&self.rocksdb_client, self.event_id, self.contract.id)
    }

    /// Sync logs in the given chunks (i.e. block ranges)
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
                            } else if error.contains("larger than 150MB limit")
                                || error.contains(
                                    "Your app has exceeded its compute units per second capacity",
                                )
                                || error.contains("Query timeout exceeded")
                            {
                                error_msg = Some(error);
                                true
                            } else {
                                panic!("Error: {}", error);
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
            event_id: self.event_id,
            contract_id: self.contract.id,
            block_num: None,
            log_index: None,
            tx_index: None,
            chunk_num: Some(0),
        };

        // Mark chunks as synched
        for chunk in &chunks {
            sync_log_key.chunk_num = Some(*chunk);
            batch.put(sync_log_key.to_bytes(), [1]);
        }

        self.rocksdb_client.write(batch).unwrap();
        if !chunks.is_empty() {
            info!("${} Synched chunk: {}", self.contract.name, chunks[0]);
        }
    }

    /// Sync contract logs up to the given block number
    pub async fn sync_to_block(&self, to_block: BlockNum) {
        let batch_size = 50;

        // Calculate the total number of chunks to sync
        let num_total_chunks =
            f64::ceil(((to_block - self.contract.deployed_block) as f64) / CHUNK_SIZE as f64)
                as u64;

        // Get the latest synched chunk. We start from the next chunk.
        let chunks_from = self.get_latest_synched_chunk().unwrap_or(0);

        debug!("${} Start from chunk: {}", self.contract.name, chunks_from);

        // A chunk is 2000 blocks. We sync in batches of 50 chunks (100,000 blocks)

        let chunk_batches = (chunks_from..num_total_chunks).collect::<Vec<ChunkNum>>();

        let jobs = chunk_batches
            .chunks(batch_size as usize)
            .map(|batch| self.sync_chunks(batch.to_vec(), to_block));

        let start = Instant::now();
        let num_jobs = jobs.len();
        join_all(jobs).await;
        info!(
            "Synced ${} in {:?} ({}jobs)",
            self.contract.name,
            start.elapsed(),
            num_jobs
        );

        // Get missing chunks
        let missing_chunks = self.search_missing_chunks(num_total_chunks);

        info!(
            "${} {}: {}",
            self.contract.name,
            "Synching Missing chunks".blue(),
            missing_chunks.len()
        );

        let missing_chunks_sync_jobs = missing_chunks
            .chunks(batch_size as usize)
            .map(|batch| self.sync_chunks(batch.to_vec(), to_block));

        join_all(missing_chunks_sync_jobs).await;
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

            tokio::time::sleep(std::time::Duration::from_secs(60)).await;
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::{
        test_utils::{delete_all, erc20_test_contract},
        utils::{count_synched_logs, dotenv_config, missing_chunk_exists},
        ROCKSDB_PATH,
    };
    use rocksdb::{Options, DB};

    #[tokio::test]
    async fn test_sync_engine() {
        dotenv_config();

        // Use a different path for the test db to avoid conflicts with the main db
        const TEST_ROCKSDB_PATH: &str = "test_sync_engine";

        let mut rocksdb_options = Options::default();
        rocksdb_options.create_if_missing(true);

        let rocksdb_conn = DB::open(
            &rocksdb_options,
            format!("{}/{}", ROCKSDB_PATH, TEST_ROCKSDB_PATH),
        )
        .unwrap();

        // Delete all records from the test db
        delete_all(&rocksdb_conn);

        let eth_client = Arc::new(EthRpcClient::new());
        let rocksdb_client = Arc::new(rocksdb_conn);

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
        contract_sync_engine.sync_to_block(to_block).await;

        // 1. Check that the number of synched logs is equal to the expected count
        let count = count_synched_logs(
            &rocksdb_client,
            ERC20_TRANSFER_EVENT_ID,
            contract.id,
            Some(to_block),
        );

        let expected_count = 7239;
        assert_eq!(count, expected_count);

        // 2. Check that the latest synched chunk is equal to the expected chunk
        let latest_synched_chunk = contract_sync_engine.get_latest_synched_chunk();
        get_latest_synched_chunk(&rocksdb_client, ERC20_TRANSFER_EVENT_ID, contract.id);

        let expected_latest_synched_chunk = 466;

        assert_eq!(latest_synched_chunk.unwrap(), expected_latest_synched_chunk);

        // 3. Check that `missing_chunk_exists` returns false
        let missing_chunks_exists = missing_chunk_exists(
            &rocksdb_client,
            ERC20_TRANSFER_EVENT_ID,
            contract.id,
            expected_latest_synched_chunk,
        );
        assert!(!missing_chunks_exists);
    }
}
