use colored::*;
use futures::future::join_all;
use indexer_rs::contracts::get_contracts;
use indexer_rs::processors::early_holders::EarlyHolderIndexer;
use indexer_rs::processors::whales::WhaleIndexer;
use indexer_rs::processors::GroupIndexer;
use indexer_rs::utils::get_block_num_from_key;
use indexer_rs::{transfer_event, Contract, TransferEvent, ROCKSDB_PATH};
use num_bigint::BigUint;
use prost::Message;
use rocksdb::{IteratorMode, Options, ReadOptions, DB};
use std::sync::Arc;
use std::{env, thread};
use std::{io::Cursor, time::Instant};
use tokio_postgres::{Error, NoTls};
use tokio_retry::strategy::{jitter, ExponentialBackoff};
use tokio_retry::Retry;

async fn index_groups_for_contract(
    pg_client: Arc<tokio_postgres::Client>,
    db: Arc<DB>,
    contract: Contract,
) -> Result<(), tokio_postgres::Error> {
    let handle = tokio::task::spawn(async move {
        // Initialize the indexers
        let mut early_holder_indexer =
            EarlyHolderIndexer::new(contract.clone(), pg_client.clone(), db.clone());

        let mut whale_indexer = WhaleIndexer::new(contract.clone(), pg_client.clone(), db.clone());

        // Initialize the groups
        early_holder_indexer.init_group().await?;
        whale_indexer.init_group().await?;

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

        let mut whale_indexer_err = false;

        let start = Instant::now();
        let mut last_block_num = None;
        for item in iterator {
            let (key, value) = item.unwrap();
            if key.starts_with(iterator_prefix) {
                // Decode the log.  // The log is in protobuf.
                let decoded =
                    transfer_event::Erc20TransferEvent::decode(&mut Cursor::new(&value)).unwrap();

                let log = TransferEvent {
                    from: decoded.from.try_into().unwrap(),
                    to: decoded.to.try_into().unwrap(),
                    value: BigUint::from_bytes_be(&decoded.value),
                };

                // Pass the log to the processors
                early_holder_indexer.process_log(&log).unwrap();
                if !whale_indexer_err {
                    whale_indexer_err = whale_indexer.process_log(&log).is_err();
                    if whale_indexer_err {
                        println!("Error processing logs for contract");
                    }
                }
            } else {
                last_block_num = Some(get_block_num_from_key(&key));
                // If the key doesn't start with the prefix, we stop the iteration
                // as that means we have iterated through all the logs for `contract.id`
                break;
            }
        }

        println!(
            "${} {} {:?}",
            contract.symbol.to_uppercase(),
            "Processed logs for contract in ".green(),
            start.elapsed()
        );

        if let Some(last_block_num) = last_block_num {
            let save_trees_start = Instant::now();
            // Save the trees to the database
            early_holder_indexer
                .save_tree(last_block_num as i64)
                .await?;

            whale_indexer.save_tree(last_block_num as i64).await?;

            println!(
                "${} {} {:?}",
                contract.symbol.to_uppercase(),
                "Saved trees for contract in ".blue(),
                save_trees_start.elapsed()
            );
        }

        Ok(())
    });

    handle.await.unwrap()?;

    Ok(())
}

/// Index the Merkle trees for all groups
async fn index_merkle_trees(
    pg_clinet: Arc<tokio_postgres::Client>,
) -> Result<(), tokio_postgres::Error> {
    let contracts = get_contracts(&pg_clinet).await;

    // Open the RocksDB connection
    let rocksdb_options = Options::default();
    let rocksdb_conn =
        Arc::new(DB::open_for_read_only(&rocksdb_options, ROCKSDB_PATH, true).unwrap());

    let mut indexing_jobs = vec![];

    // Initialize the retry strategy
    let retry_strategy = ExponentialBackoff::from_millis(10)
        .map(jitter) // add jitter to delays
        .take(3); // limit to 3 retries

    for contract in contracts.iter() {
        // Wrap the `index_groups_for_contract` function in a retry
        let with_retries = Retry::spawn(retry_strategy.clone(), || async {
            let result = index_groups_for_contract(
                pg_clinet.clone(),
                rocksdb_conn.clone(),
                contract.clone(),
            )
            .await;
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

#[tokio::main]
async fn main() -> Result<(), Error> {
    let is_render = env::var("RENDER").is_ok();
    if !is_render {
        // Call dotenv in non-render environment
        dotenv::from_filename(format!("{}/.env", env::var("CARGO_MANIFEST_DIR").unwrap())).ok();
        dotenv::dotenv().ok();
    }

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Connect to the database.
    let (client, connection) = tokio_postgres::connect(&database_url, NoTls).await?;

    let pg_client = Arc::new(client);
    // The connection object performs the actual communication with the database,
    // so spawn it off to run on its own.
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {}", e);
        }
    });

    loop {
        index_merkle_trees(pg_client.clone()).await?;
        thread::sleep(std::time::Duration::from_secs(5 * 60)); // Sleep for 5 minutes
    }
}
