mod processors;
mod storage;
mod tree;

use futures::future::join_all;
use num_bigint::BigUint;
use processors::early_holders::{get_early_holder_handle, EarlyHolderIndexer};
use processors::whales::{get_whale_handle, WhaleIndexer};
use processors::ProcessorLike;
use prost::Message;
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use rocksdb::{IteratorMode, Options, ReadOptions, DB};
use std::{io::Cursor, time::Instant};
use storage::postgres::PostgresStorage;
use storage::{Contract, Storage};
use tokio_postgres::{Error, NoTls};
use tokio_retry::strategy::{jitter, ExponentialBackoff};
use tokio_retry::Retry;

pub mod transfer_event {
    include!(concat!(env!("OUT_DIR"), "/transfer_event.rs"));
}

pub mod merkle_proof {
    include!(concat!(env!("OUT_DIR"), "/merkle_proof.rs"));
}

const PATH: &str = "./db";

#[derive(Debug, Clone)]
pub struct TransferEvent {
    from: [u8; 20],
    to: [u8; 20],
    value: BigUint,
}

enum Processor<S: Storage> {
    Whale(WhaleIndexer<S>),
    EarlyHolder(EarlyHolderIndexer<S>),
}

fn get_block_num_from_key(key: &[u8]) -> u64 {
    let mut block_num_bytes = [0; 8];
    block_num_bytes.copy_from_slice(&key[2..10]);
    u64::from_be_bytes(block_num_bytes)
}

fn get_contract_id_from_key(key: &[u8]) -> u16 {
    let mut contract_id_bytes = [0; 2];
    contract_id_bytes.copy_from_slice(&key[0..2]);
    u16::from_be_bytes(contract_id_bytes)
}

async fn process_contract_logs<S: Storage>(
    storage: &S,
    db: &DB,
    contract: &Contract,
) -> Result<(), S::ErrorType> {
    // Initialize the processors
    let whale_processor = WhaleIndexer::new(contract.clone());
    let early_holders_processor = EarlyHolderIndexer::new(contract.name.clone());

    println!("Processing logs for contract {}", contract.id);

    // First, we find the latest log block number for `contract`.
    // We do this by iterating through the logs in reverse order and stopping when we find the first log for `contract`.
    // We iterate in reverse from the next contract id.

    let next_contract_id = contract.id + 1;
    let next_contract_id_key = &next_contract_id.to_be_bytes()[2..];

    // Initialize the RocksDB iterator
    let iterator = db.iterator(IteratorMode::From(
        next_contract_id_key,
        rocksdb::Direction::Reverse,
    ));

    let mut latest_log_block_num = None;
    for item in iterator {
        let (key, _value) = item.unwrap();
        let contract_id = get_contract_id_from_key(&key);

        // If we find a log for `contract.id`, we stop the iteration
        if contract_id == contract.id as u16 {
            latest_log_block_num = Some(get_block_num_from_key(&key) as i64);
            println!("Latest log block num {:?}", latest_log_block_num.unwrap());
            break;
        }

        if contract_id < contract.id as u16 {
            println!("No logs for contract {}", contract.id);
            // We didn't find any logs for `contract.id`
            break;
        }
    }

    let mut processors: Vec<Processor<S>> = vec![];

    // Add the whale processor to `processors` if there are new logs
    if latest_log_block_num.is_some() {
        // Add the whale processor to `processors` if there are new logs
        if whale_processor.latest_tree_block_num(storage).await? != latest_log_block_num.unwrap() {
            println!("New logs for contract {}", contract.id);
            processors.push(Processor::Whale(whale_processor));
        }

        // Add the early holder processor to `processors` if there are new logs
        if early_holders_processor
            .latest_tree_block_num(storage)
            .await?
            != latest_log_block_num.unwrap()
        {
            processors.push(Processor::EarlyHolder(early_holders_processor));
        }
    }

    if processors.is_empty() {
        println!("No new logs for contract {}", contract.id);
        return Ok(());
    }

    // The iterator prefix is the contract id in 2 bytes
    let iterator_prefix = &contract.id.to_be_bytes()[2..];

    // Initialize the RocksDB iterator that starts from the first log for `contract.id`
    let mut iterator_ops = ReadOptions::default();
    iterator_ops.set_async_io(true);

    // Initialize the RocksDB prefix iterator (i.e. the iterator starts from key [contract_id, 0, 0, 0, 0,  ... 0])
    let iterator = db.iterator_opt(
        IteratorMode::From(iterator_prefix, rocksdb::Direction::Forward),
        iterator_ops,
    );

    let start_time = Instant::now();
    let mut items = vec![];

    for item in iterator {
        let (key, value) = item.unwrap();
        if key.starts_with(iterator_prefix) {
            items.push(value);
        } else {
            // If the key doesn't start with the prefix, we stop the iteration
            // as that means we have iterated through all the logs for `contract.id`
            break;
        }
    }

    // Decode the logs in parallel.
    // The logs are in protobuf format
    let decoded_items = items
        .par_iter()
        .map(|value| {
            // Decode the logs that are in protobuf format
            let decoded =
                transfer_event::Erc20TransferEvent::decode(&mut Cursor::new(&value)).unwrap();

            TransferEvent {
                from: decoded.from.try_into().unwrap(),
                to: decoded.to.try_into().unwrap(),
                value: BigUint::from_bytes_be(&decoded.value),
            }
        })
        .collect::<Vec<TransferEvent>>();

    // Flag to indicate if the contract has negative balance.
    // If the contract has negative balance, we don't abort the processing.
    let mut negative_balance = false;

    for transfer_event_log in decoded_items {
        for processor in processors.iter_mut() {
            match processor {
                Processor::Whale(whale_processor) => {
                    if !negative_balance {
                        match whale_processor.process_log(&transfer_event_log) {
                            Ok(_) => {}
                            Err(_) => {
                                println!("Error processing log {:?}", contract.symbol);
                                negative_balance = true;
                            }
                        };
                    }
                }
                Processor::EarlyHolder(early_holders_processor) => {
                    early_holders_processor
                        .process_log(&transfer_event_log)
                        .unwrap();
                }
            }
        }
    }

    let elapsed = start_time.elapsed();
    println!(
        "Processed logs for contract {} in {:?}",
        contract.id, elapsed
    );

    // Index the Merkle trees based on the output of the processors
    for processor in &mut processors {
        match processor {
            Processor::Whale(whale_processor) => {
                whale_processor
                    .index_tree(storage, latest_log_block_num.unwrap())
                    .await?;
            }
            Processor::EarlyHolder(early_holders_processor) => {
                early_holders_processor
                    .index_tree(storage, latest_log_block_num.unwrap())
                    .await?;
            }
        }
    }
    println!("Indexed trees for contract {}", contract.id);

    Ok(())
}

// Initialize groups for all contracts
async fn init_contract_groups<S: Storage>(storage: &S) -> Result<(), S::ErrorType> {
    let contracts = storage.get_contracts().await?;

    let group_upserts = contracts.iter().flat_map(|contract| {
        contract.target_groups.iter().map(|target_group| {
            // Get the handle and display name for the group based on the target group
            let (handle, display_name) = if target_group == "whale" {
                (
                    get_whale_handle(&contract.name),
                    format!("{} whale", contract.symbol.clone().to_uppercase()),
                )
            } else if target_group == "earlyHolder" {
                (
                    get_early_holder_handle(&contract.name),
                    format!("Early {} holder", contract.symbol.clone().to_uppercase()),
                )
            } else {
                panic!("Invalid target group: {}", target_group);
            };

            // Return the future that upserts the group
            storage.upsert_group(
                handle.clone(),
                GroupUpsertData {
                    display_name: display_name.clone(),
                },
            )
        })
    });

    // Run all upserts concurrently
    join_all(group_upserts).await;

    Ok(())
}

/// Index the Merkle trees for all groups
async fn index_merkle_trees<S: Storage>(storage: &S) -> Result<(), S::ErrorType> {
    // Get all contracts from the storage
    let contracts = storage.get_contracts().await?;

    // Open the RocksDB connection
    let rocksdb_options = Options::default();
    let rocksdb_conn = DB::open_for_read_only(&rocksdb_options, PATH, true).unwrap();

    let mut indexing_jobs = vec![];

    // Initialize the retry strategy
    let retry_strategy = ExponentialBackoff::from_millis(10)
        .map(jitter) // add jitter to delays
        .take(3); // limit to 3 retries

    for contract in contracts.iter() {
        // Wrap the `process_contract_logs` function in a retry
        let with_retries = Retry::spawn(retry_strategy.clone(), || async {
            let result = process_contract_logs(storage, &rocksdb_conn, contract).await;
            if result.is_err() {
                println!("Error {:?}", result);
            }

            result
        });

        indexing_jobs.push(with_retries);
    }

    let start_time = Instant::now();
    // Run the indexing jobs concurrently
    join_all(indexing_jobs).await;
    println!("Indexing took {:?}", start_time.elapsed());

    Ok(())
}

use std::thread;

use crate::storage::GroupUpsertData;

#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenv::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Connect to the database.
    let (client, connection) = tokio_postgres::connect(&database_url, NoTls).await?;
    let storage = PostgresStorage::new(client);

    // The connection object performs the actual communication with the database,
    // so spawn it off to run on its own.
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {}", e);
        }
    });

    loop {
        init_contract_groups(&storage).await?;
        index_merkle_trees(&storage).await?;
        thread::sleep(std::time::Duration::from_secs(5 * 60)); // Sleep for 5 minutes
    }
}
