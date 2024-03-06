use colored::*;
use futures::future::join_all;
use indexer_rs::contracts::get_contracts;
use indexer_rs::eth_rpc::{EthClientFactory, EthRpcClient};
use indexer_rs::utils::{
    get_block_num_from_key, get_contract_id_from_key, value_to_u32, value_to_u64,
};
use indexer_rs::Contract;
use indexer_rs::{transfer_event, ROCKSDB_PATH};
use prost::Message;
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use rocksdb::{IteratorMode, Options, WriteBatch, DB};
use serde_json::Value;
use std::cmp::min;
use std::thread;
use std::{env, time::Instant};
use tokio_postgres::NoTls;

/// Get the block number of the contract's latest synched log
async fn get_synched_block(rocksdb_conn: &DB, contract_id: i32) -> Option<i64> {
    // First, we find the latest log block number for `contract`.
    // We do this by iterating through the logs in reverse order and stopping when we find the first log for `contract`.
    // We iterate in reverse from the next contract id.

    let next_contract_id = contract_id + 1;
    let next_contract_id_key = &next_contract_id.to_be_bytes()[2..];

    // Initialize the RocksDB iterator
    let iterator = rocksdb_conn.iterator(IteratorMode::From(
        next_contract_id_key,
        rocksdb::Direction::Reverse,
    ));

    let mut latest_log_block_num = None;
    for item in iterator {
        let (key, _value) = item.unwrap();
        let item_contract_id = get_contract_id_from_key(&key);

        // If we find a log for `contract.id`, we stop the iteration
        if item_contract_id == contract_id as u16 {
            latest_log_block_num = Some(get_block_num_from_key(&key) as i64);
            println!("Latest log block num {:?}", latest_log_block_num.unwrap());
            break;
        }

        if item_contract_id < contract_id as u16 {
            println!("No logs for contract {}", contract_id);
            // We didn't find any logs for `contract.id`
            break;
        }
    }

    latest_log_block_num
}

/// Save logs to RocksDB
fn save_logs_batch(rocksdb_conn: &DB, logs_batch: Vec<Vec<Value>>, contract: &Contract) {
    let mut batch = WriteBatch::default();

    let parsed_logs: Vec<(Vec<u8>, Vec<u8>)> = logs_batch
        .par_iter()
        .flat_map(|logs_batch| {
            logs_batch.par_iter().map(|log| {
                let log_index = value_to_u32(&log["logIndex"]);
                let tx_index = value_to_u32(&log["transactionIndex"]);
                let block_number = value_to_u64(&log["blockNumber"]);
                let value =
                    hex::decode(log["data"].as_str().unwrap().trim_start_matches("0x")).unwrap();

                let topics = &log["topics"].as_array().unwrap();

                let from = &topics[1].as_str().unwrap();
                let to = &topics[2].as_str().unwrap();

                let from = hex::decode(&from[from.len() - 40..]).unwrap();
                let to = hex::decode(&to[to.len() - 40..]).unwrap();

                let contract_id_bytes = (contract.id as u16).to_be_bytes();
                let block_number_bytes = block_number.to_be_bytes();
                let log_index_bytes = log_index.to_be_bytes();
                let tx_index_bytes = tx_index.to_be_bytes();

                let mut key = Vec::new();
                key.extend_from_slice(&contract_id_bytes);
                key.extend_from_slice(&block_number_bytes);
                key.extend_from_slice(&tx_index_bytes);
                key.extend_from_slice(&log_index_bytes);

                let transfer_event = transfer_event::Erc20TransferEvent { from, to, value };

                let mut value = Vec::new();
                transfer_event.encode(&mut value).unwrap();

                (key, value)
            })
        })
        .collect();

    for (key, value) in parsed_logs {
        batch.put(&key, &value);
    }

    rocksdb_conn.write(batch).unwrap();
}

async fn sync_contract_transfers(eth_client: EthRpcClient, rocksdb_conn: &DB, contract: &Contract) {
    let latest_synched_block = get_synched_block(rocksdb_conn, contract.id).await;

    let latest_block = eth_client.get_block_number().await.unwrap();

    // We fetch logs `num_chunks` chunks in parallel.
    let mut num_chunks = 100;

    // We fetch `chunk_size` blocks in each chunk.
    let chunk_size = 2000;

    // The block number to start fetching logs from.
    // If we already have logs synched in the db, we start from the next block.
    // Otherwise, we start from the contract's deployed block.
    let mut from_block = if let Some(latest_synched_block) = latest_synched_block {
        latest_synched_block + 1
    } else {
        contract.deployed_block
    } as u64;

    println!(
        "Syncing contract ${} from block {}",
        contract.symbol.to_uppercase(),
        from_block
    );

    let start_time = Instant::now();

    // Loop through the blocks and fetch logs
    loop {
        let iteration_start_time = Instant::now();

        // Block ranges to fetch logs.
        // We use batch requests to fetch logs in parallel.
        let mut block_ranges = vec![];

        for j in 0..num_chunks {
            let chunk_from = from_block + j * chunk_size;
            let chunk_to = from_block + (j + 1) * chunk_size;

            if chunk_to > latest_block {
                block_ranges.push([chunk_from, latest_block]);
                break;
            } else {
                block_ranges.push([chunk_from, chunk_to]);
            }
        }

        let ranges_last_block = block_ranges[block_ranges.len() - 1][1];

        println!(
            "${} Fetching logs from {} to {} ({})",
            contract.symbol, from_block, ranges_last_block, num_chunks
        );

        let result = eth_client
            .get_logs_batch(
                &contract.address,
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                &block_ranges,
            )
            .await;

        match result {
            Ok(result) => {
                let batches = result.as_array();

                if let Some(batches) = batches {
                    let mut logs_batch = vec![];

                    let mut need_retry = false;

                    for batch in batches {
                        let batch_result = batch["result"].as_array().cloned();
                        let error = batch["error"].to_string();

                        if let Some(batch_result) = batch_result {
                            logs_batch.push(batch_result);
                        } else if error.contains("larger than 150MB limit") {
                            println!("{}", "Response is larger than 150MB limit".red());
                            need_retry = true;

                            // We reduce the number of chunks and retry
                            num_chunks /= 4;
                            break;
                        } else {
                            // Encountered unexpected error
                            panic!("Error: {}", error);
                        }
                    }

                    if !need_retry {
                        let num_log = logs_batch.iter().flatten().count();
                        println!(
                            "{} {} {} {} ${}",
                            "Saving".blue(),
                            num_log,
                            "logs".blue(),
                            "for ".blue(),
                            contract.symbol.to_uppercase(),
                        );
                        save_logs_batch(rocksdb_conn, logs_batch, contract);
                        from_block = ranges_last_block + 1;
                        num_chunks = min(num_chunks * 2, 1000);
                    }
                }
            }
            Err(e) => {
                println!("Error (retrying): {:?}", e);
            }
        }

        if ranges_last_block == latest_block {
            break;
        }

        // Print bps (blocks per second)
        println!(
            "{:?} bps",
            ((chunk_size * num_chunks) as f64 / iteration_start_time.elapsed().as_secs_f64())
        );
    }

    // Print the time it took to sync the transfers in contract
    println!(
        "{} ${} {}: {:?}",
        "Syncing contract".green(),
        contract.symbol.to_uppercase().to_string().green(),
        "took".green(),
        start_time.elapsed()
    );
}

#[tokio::main]
async fn main() {
    let is_render = env::var("RENDER").is_ok();
    if !is_render {
        // Call dotenv in non-render environment
        dotenv::from_filename(format!("{}/.env", env::var("CARGO_MANIFEST_DIR").unwrap())).ok();
        dotenv::dotenv().ok();
    }

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    // Connect to the database.
    let (client, connection) = tokio_postgres::connect(&database_url, NoTls).await.unwrap();

    // The connection object performs the actual communication with the database,
    // so spawn it off to run on its own.
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {}", e);
        }
    });

    let contracts = get_contracts(&client).await;

    // Open the RocksDB connection
    let mut rocksdb_options = Options::default();
    rocksdb_options.create_if_missing(true);
    let rocksdb_conn = DB::open(&rocksdb_options, ROCKSDB_PATH).unwrap();

    let rocksdb_conn = rocksdb_conn;

    loop {
        let mut eth_client_factory = EthClientFactory::new();
        let jobs = contracts.iter().map(|contract| {
            // Create an EthRpcClient for the chain
            let eth_client = eth_client_factory.create(contract.chain).unwrap();

            // Sync the transfers logs for the contract
            sync_contract_transfers(eth_client, &rocksdb_conn, contract)
        });

        let start_time = Instant::now();
        join_all(jobs).await;
        println!("Sync took: {:?}", start_time.elapsed());

        thread::sleep(std::time::Duration::from_secs(5)); // Sleep for 5 minutes
    }
}
