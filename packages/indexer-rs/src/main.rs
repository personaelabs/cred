mod prisma;
mod processors;
mod tree;
use futures::future::join_all;
use num_bigint::BigUint;
use prisma::PrismaClient;
use prisma::{contract, group};
use prisma_client_rust::{Direction, NewClientError, QueryError};
use processors::early_holders::{get_early_holder_handle, EarlyHolderIndexer};
use processors::whales::{get_whale_handle, WhaleIndexer};
use processors::ProcessorLike;
use prost::Message;
use rocksdb::{IteratorMode, Options, ReadOptions, DB};
use std::{io::Cursor, time::Instant};
use tokio_retry::strategy::{jitter, ExponentialBackoff};
use tokio_retry::Retry;

pub mod transfer_event {
    include!(concat!(env!("OUT_DIR"), "/transfer_event.rs"));
}

const PATH: &str = "../../db";

#[derive(Debug, Clone)]
pub struct TransferEvent {
    from: [u8; 20],
    to: [u8; 20],
    value: BigUint,
}

enum Processor {
    Whale(WhaleIndexer),
    EarlyHolder(EarlyHolderIndexer),
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

async fn process_contract_logs(
    prisma_client: &PrismaClient,
    db: &DB,
    contract: &contract::Data,
) -> Result<(), QueryError> {
    // Initialize the processors
    let whale_processor = WhaleIndexer::new(contract.clone());
    let early_holders_processor = EarlyHolderIndexer::new(contract.clone());

    println!("Processing logs for contract {}", contract.id);

    let next_contract_id = contract.id + 1;
    let next_contract_id_key = &next_contract_id.to_be_bytes()[2..];
    println!("Next contract id key {:?}", next_contract_id_key);

    let iterator = db.iterator(IteratorMode::From(
        next_contract_id_key,
        rocksdb::Direction::Reverse,
    ));

    let mut latest_log_block_num = None;
    for item in iterator {
        let (key, _value) = item.unwrap();
        let contract_id = get_contract_id_from_key(&key);
        println!("Contract id {:?}", contract_id);
        if contract_id == contract.id as u16 {
            latest_log_block_num = Some(get_block_num_from_key(&key));
            println!("Latest log block num {:?}", latest_log_block_num.unwrap());
            break;
        }

        if contract_id < contract.id as u16 {
            println!("No logs for contract {}", contract.id);
            // We didn't find any logs for `contract.id`
            break;
        }
    }

    let mut processors: Vec<Processor> = vec![];

    // Add the whale processor to `processors` if there are new logs
    if latest_log_block_num.is_some() {
        // Add the whale processor to `processors` if there are new logs
        if whale_processor.latest_tree_block_num(prisma_client).await?
            != latest_log_block_num.unwrap()
        {
            println!("New logs for contract {}", contract.id);
            processors.push(Processor::Whale(whale_processor));
        }

        // Add the early holder processor to `processors` if there are new logs
        if early_holders_processor
            .latest_tree_block_num(prisma_client)
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

    // The prefix is the contract id in 2 bytes
    let prefix = &contract.id.to_be_bytes()[2..];

    let start_time = Instant::now();
    let iterator_ops = ReadOptions::default();

    // Initialize the RocksDB prefix iterator (i.e. the iterator starts from key [contract_id, 0, 0, 0, 0,  ... 0])
    let iterator = db.iterator_opt(
        IteratorMode::From(prefix, rocksdb::Direction::Forward),
        iterator_ops,
    );

    for item in iterator {
        let (key, value) = item.unwrap();
        if key.starts_with(prefix) {
            let decoded: transfer_event::Erc20TransferEvent =
                transfer_event::Erc20TransferEvent::decode(&mut Cursor::new(&value)).unwrap();
            let transfer_event = TransferEvent {
                from: decoded.from.try_into().unwrap(),
                to: decoded.to.try_into().unwrap(),
                value: BigUint::from_bytes_be(&decoded.value),
            };

            let mut errored_processors = vec![];
            for (i, processor) in processors.iter_mut().enumerate() {
                match processor {
                    Processor::Whale(whale_processor) => {
                        match whale_processor.process_log(&transfer_event) {
                            Ok(_) => {}
                            Err(_) => {
                                println!("Error processing log {:?}", contract.symbol);
                                errored_processors.push(i);
                            }
                        };
                    }
                    Processor::EarlyHolder(early_holders_processor) => {
                        early_holders_processor
                            .process_log(&transfer_event)
                            .unwrap();
                    }
                }
            }

            // Remove errored processors from the list of processors to execute
            for i in errored_processors {
                processors.remove(i);
            }
        } else {
            // We have reached the end of the logs for this contract
            break;
        }
    }

    let elapsed = start_time.elapsed();
    println!(
        "Processed logs for contract {} in {:?}",
        contract.id, elapsed
    );

    // Index the trees
    for processor in &mut processors {
        match processor {
            Processor::Whale(whale_processor) => {
                whale_processor
                    .index_tree(prisma_client, latest_log_block_num.unwrap())
                    .await?;
            }
            Processor::EarlyHolder(early_holders_processor) => {
                early_holders_processor
                    .index_tree(prisma_client, latest_log_block_num.unwrap())
                    .await?;
            }
        }
    }
    println!("Indexed trees for contract {}", contract.id);

    Ok(())
}

async fn index_trees(client: &PrismaClient) -> Result<(), QueryError> {
    let result: Result<Vec<contract::Data>, QueryError> = client
        .contract()
        .find_many(vec![])
        .order_by(contract::id::order(Direction::Asc))
        .exec()
        .await;

    let contracts = result.unwrap();

    println!("Contracts {:?}", contracts.len());

    // Upsert groups for contracts
    for contract in &contracts {
        for target_group in contract.target_groups.clone() {
            let (handle, display_name) = if target_group == "whale" {
                (
                    get_whale_handle(contract),
                    format!("{} whale", contract.symbol.clone().unwrap().to_uppercase()),
                )
            } else if target_group == "earlyHolder" {
                (
                    get_early_holder_handle(contract),
                    format!(
                        "Early {} holder",
                        contract.symbol.clone().unwrap().to_uppercase()
                    ),
                )
            } else {
                panic!("Invalid target group: {}", target_group);
            };

            client
                .group()
                .upsert(
                    group::handle::equals(handle.clone()),
                    group::create(
                        handle,
                        display_name.clone(),
                        vec![
                            group::display_name::set(display_name.clone()),
                            group::r#type::set(Some(target_group.clone())),
                        ],
                    ),
                    vec![
                        group::display_name::set(display_name.clone()),
                        group::r#type::set(Some(target_group)),
                    ],
                )
                .exec()
                .await?;
        }
    }

    let db_options = Options::default();
    let db = DB::open_for_read_only(&db_options, PATH, true).unwrap();

    let start_time = Instant::now();
    let mut indexing_jobs = vec![];

    let retry_strategy = ExponentialBackoff::from_millis(10)
        .map(jitter) // add jitter to delays
        .take(3); // limit to 3 retries

    for contract in contracts.iter() {
        let with_retries = Retry::spawn(retry_strategy.clone(), || async {
            let result = process_contract_logs(&client, &db, contract).await;
            if result.is_err() {
                println!("Error {:?}", result);
            }

            result
        });

        indexing_jobs.push(with_retries);
    }

    let start_time = Instant::now();
    join_all(indexing_jobs).await;
    println!("Indexing took {:?}", start_time.elapsed());

    Ok(())
}

use std::thread;

#[tokio::main]
async fn main() -> Result<(), QueryError> {
    let client: Result<PrismaClient, NewClientError> = PrismaClient::_builder().build().await;
    let client = client.unwrap();

    loop {
        index_trees(&client).await?;
        thread::sleep(std::time::Duration::from_secs(5)); // Sleep for 5 minutes
    }
}
