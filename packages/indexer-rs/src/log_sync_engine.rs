use crate::contract::{Contract, ContractType};
use crate::eth_rpc::EthRpcClient;
use crate::rocksdb_key::{KeyType, RocksDbKey, ERC20_TRANSFER_EVENT_ID, ERC721_TRANSFER_EVENT_ID};
use crate::transfer_event;
use crate::utils::{value_to_u32, value_to_u64};
use colored::*;
use core::panic;
use futures::future::join_all;
use log::{debug, error, info};
use prost::Message;
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use rocksdb::{IteratorMode, WriteBatch};
use serde_json::Value;
use std::cmp::min;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::Semaphore;

pub const CHUNK_SIZE: u64 = 2000;

pub struct LogSyncEngine {
    semaphore: Arc<Semaphore>,
    eth_client: Arc<EthRpcClient>,
    contract: Contract,
    event_id: u16,
    rocksdb_client: Arc<rocksdb::DB>,
}

impl LogSyncEngine {
    pub fn new(
        eth_client: Arc<EthRpcClient>,
        contract: Contract,
        rocksdb_client: Arc<rocksdb::DB>,
    ) -> Self {
        // Determine the event_id form `contract.type`
        let event_id = match contract.contract_type {
            ContractType::ERC20 => ERC20_TRANSFER_EVENT_ID,
            ContractType::ERC721 => ERC721_TRANSFER_EVENT_ID,
            _ => panic!("Invalid contract type"),
        };

        let semaphore = Arc::new(Semaphore::new(30));

        Self {
            semaphore,
            eth_client,
            contract,
            event_id,
            rocksdb_client,
        }
    }

    /// Search for chunks that aren't synched yet
    fn search_missing_chunks(&self) -> Vec<u64> {
        let start_key = RocksDbKey {
            key_type: KeyType::SyncLog,
            event_id: self.event_id,
            contract_id: self.contract.id,
            block_num: None,
            log_index: None,
            tx_index: None,
            chunk_num: Some(0),
        };

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

            if key.chunk_num.unwrap() != expected_chunk_num as u64 {
                missing_chunks.push(expected_chunk_num as u64);
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
                    let log_index = value_to_u32(&log["logIndex"]);
                    let tx_index = value_to_u32(&log["transactionIndex"]);
                    let block_number = value_to_u64(&log["blockNumber"]);
                    let value = hex::decode(log["data"].as_str().unwrap().trim_start_matches("0x"))
                        .unwrap();

                    let topics = &log["topics"].as_array().unwrap();

                    let from = &topics[1].as_str().unwrap();
                    let to = &topics[2].as_str().unwrap();

                    let from = hex::decode(&from[from.len() - 40..]).unwrap();
                    let to = hex::decode(&to[to.len() - 40..]).unwrap();

                    let key = RocksDbKey {
                        key_type: KeyType::EventLog,
                        event_id: self.event_id,
                        contract_id: self.contract.id,
                        block_num: Some(block_number),
                        log_index: Some(log_index),
                        tx_index: Some(tx_index),
                        chunk_num: None,
                    };

                    let transfer_event = transfer_event::Erc20TransferEvent { from, to, value };

                    let mut value = Vec::new();
                    transfer_event.encode(&mut value).unwrap();

                    (key.to_bytes().to_vec(), value)
                })
            })
            .collect();

        for (key, value) in parsed_logs {
            batch.put(&key, &value);
        }

        self.rocksdb_client.write(batch).unwrap();
    }

    /// Get the latest synched chunk
    fn get_latest_synched_chunk(&self) -> u64 {
        let start_key =
            RocksDbKey::new_start_key(KeyType::SyncLog, self.event_id, self.contract.id);

        let iterator = self.rocksdb_client.iterator(IteratorMode::From(
            &start_key.to_bytes(),
            rocksdb::Direction::Forward,
        ));

        let mut latest_chunk = 0;
        for item in iterator {
            let (key_bytes, _value) = item.unwrap();

            let key = RocksDbKey::from_bytes(key_bytes.as_ref().try_into().unwrap());

            if key.key_type != KeyType::SyncLog
                || key.event_id != self.event_id
                || key.contract_id != self.contract.id
            {
                break;
            }

            latest_chunk = key.chunk_num.unwrap();
        }

        latest_chunk
    }

    /// Sync logs in the given chunks (i.e. block ranges)
    async fn sync_chunks(&self, chunks: Vec<u64>, latest_block: u64) {
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
                    &self.semaphore,
                    self.contract.chain,
                    &self.contract.address,
                    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
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
                                self.contract.symbol.to_uppercase(),
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
                    error!(
                        "${} Error (retrying): {:?}",
                        self.contract.symbol.to_uppercase(),
                        e
                    );
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
            chunk_num: Some(chunks[0]),
        };

        // Mark chunks as synched
        for chunk in &chunks {
            sync_log_key.chunk_num = Some(*chunk);
            batch.put(sync_log_key.to_bytes(), [1]);
        }

        self.rocksdb_client.write(batch).unwrap();
        info!(
            "${} Synched chunk: {}",
            self.contract.symbol.to_uppercase(),
            chunks[0]
        );
    }

    pub async fn sync(self) {
        let batch_size = 50;

        // Start the background sync loop
        loop {
            let latest_block = self
                .eth_client
                .get_block_number(&self.semaphore, self.contract.chain)
                .await;

            if latest_block.is_err() {
                error!(
                    "${} get_block_number Error: {:?}",
                    self.contract.symbol.to_uppercase(),
                    latest_block.err().unwrap()
                );
                tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                continue;
            }

            let latest_block = latest_block.unwrap();

            let num_total_chunks = f64::ceil(
                ((latest_block - self.contract.deployed_block) as f64) / CHUNK_SIZE as f64,
            ) as u64;

            let mut chunks_from = self.get_latest_synched_chunk();

            debug!(
                "${} Start from chunk: {}",
                self.contract.symbol.to_uppercase(),
                chunks_from
            );

            let mut chunks_to = min(chunks_from + batch_size, num_total_chunks);

            let mut jobs = vec![];

            loop {
                let chunks = (chunks_from..chunks_to).collect::<Vec<u64>>();

                let job = self.sync_chunks(chunks, latest_block);
                jobs.push(job);

                if chunks_to >= num_total_chunks {
                    break;
                }

                chunks_from = chunks_to;
                chunks_to = min(chunks_to + batch_size, num_total_chunks);
            }

            let start = Instant::now();
            let num_jobs = jobs.len();
            join_all(jobs).await;
            info!(
                "Synced ${} in {:?} ({}jobs)",
                self.contract.symbol.to_uppercase(),
                start.elapsed(),
                num_jobs
            );

            let missing_chunks = self.search_missing_chunks();
            info!(
                "${} {}: {}",
                self.contract.symbol.to_uppercase(),
                "Synching Missing chunks".blue(),
                missing_chunks.len()
            );
            let mut start_index = 0;

            let mut missing_chunks_sync_jobs = vec![];
            while start_index < missing_chunks.len() {
                let end_index = min(start_index + batch_size as usize, missing_chunks.len());
                let chunk = missing_chunks[start_index..end_index].to_vec();

                let job = self.sync_chunks(chunk, latest_block);
                missing_chunks_sync_jobs.push(job);

                start_index = end_index;
            }

            join_all(missing_chunks_sync_jobs).await;

            tokio::time::sleep(std::time::Duration::from_secs(60)).await;
        }
    }
}
