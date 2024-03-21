extern crate merkle_tree as merkle_tree_lib;
use crate::contract::Contract;
use crate::contract_event_iterator::ContractEventIterator;
use crate::eth_rpc::EthRpcClient;
use crate::merkle_tree_proto::{self, MerkleTreeLayer};
use crate::processors::all_holders::AllHoldersIndexer;
use crate::processors::early_holders::EarlyHolderIndexer;
use crate::processors::ticker::TickerIndexer;
use crate::processors::whales::WhaleIndexer;
use crate::processors::GroupIndexer;
use crate::rocksdb_key::{ERC20_TRANSFER_EVENT_ID, ERC721_TRANSFER_EVENT_ID};
use crate::utils::dev_addresses;
use crate::{Address, EventId, GroupType};
use bloomfilter::Bloom;
use colored::*;
use futures::future::join_all;
use log::{error, info, warn};
use merkle_tree_lib::ark_ff::{BigInteger, Field, PrimeField};
use merkle_tree_lib::ark_secp256k1::Fq;
use merkle_tree_lib::poseidon::constants::secp256k1_w3;
use merkle_tree_lib::tree::MerkleTree;
use num_bigint::BigUint;
use num_format::{Locale, ToFormattedString};
use prost::Message;
use rocksdb::DB;
use std::collections::HashMap;
use std::env;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::Semaphore;

const TREE_DEPTH: usize = 18;
const TREE_WIDTH: usize = 3;
const BLOOM_FILTER_FP_RATE: f64 = 0.005;

fn to_hex(fe: Fq) -> String {
    format!("0x{}", BigUint::from(fe.into_bigint()).to_str_radix(16))
}

async fn process_event_logs(
    db: &DB,
    contract: &Contract,
    event_id: EventId,
    indexers: &mut Vec<Box<dyn GroupIndexer>>,
) {
    let start = Instant::now();

    let mut latest_block_num = None;

    let mut errored_indexers = vec![];

    // Initialize an iterator that iterates through the logs for the contract event
    let iterator = ContractEventIterator::new(db, event_id, contract.id);

    for (key, value) in iterator {
        // Run the log through the indexers
        for (i, indexer) in indexers.iter_mut().enumerate() {
            if errored_indexers.contains(&i) {
                continue;
            }

            let result = indexer.process_log(key, &value);
            if let Err(err) = result {
                error!(
                    "${} {} Error processing logs for contract {:?}",
                    contract.symbol.to_uppercase(),
                    indexer.group_handle(),
                    err
                );

                errored_indexers.push(i);
            }
        }

        latest_block_num = Some(key.block_num.unwrap());
    }

    info!(
        "${} Iterated through logs in {:?}",
        contract.symbol.to_uppercase(),
        start.elapsed()
    );

    if let Some(latest_block_num) = latest_block_num {
        let save_trees_start = Instant::now();

        // Run `save_tree` for each indexer
        for (i, indexer) in indexers.iter().enumerate() {
            if errored_indexers.contains(&i) {
                // Skip the saving tree if the indexer errored
                warn!(
                    "${} Skipping saving tree for '{}' due to previous error",
                    contract.symbol.to_uppercase(),
                    indexer.group_handle()
                );
                continue;
            }

            let result = indexer.save_tree(latest_block_num as i64).await;
            if let Err(err) = result {
                error!(
                    "${} {} Error saving tree for contract {:?}",
                    contract.symbol.to_uppercase(),
                    indexer.group_handle(),
                    err
                );
            }

            info!(
                "${} Saved tree for '{}' in {:?}",
                contract.symbol.to_uppercase(),
                indexer.group_handle(),
                save_trees_start.elapsed()
            );
        }
    } else {
        error!(
            "${} No logs found for contract",
            contract.symbol.to_uppercase()
        );
    }
}

async fn is_indexer_ready(contract: &Contract, indexer: &impl GroupIndexer) -> bool {
    let is_indexer_ready = indexer.is_ready().await;
    if let Ok(is_indexer_ready) = is_indexer_ready {
        if is_indexer_ready {
            true
        } else {
            info!(
                "${} Indexer for '{}' is waiting...",
                contract.symbol.to_uppercase(),
                indexer.group_handle()
            );
            false
        }
    } else {
        error!(
            "${} {} Error checking if indexer is ready {}",
            contract.symbol.to_uppercase(),
            indexer.group_handle(),
            is_indexer_ready.unwrap_err()
        );
        false
    }
}

pub async fn index_groups_for_contract(
    semaphore: Arc<Semaphore>,
    pg_client: Arc<tokio_postgres::Client>,
    db: Arc<DB>,
    eth_client: Arc<EthRpcClient>,
    contract: Contract,
) {
    loop {
        let permit = semaphore.acquire().await.unwrap();
        let mut indexers: HashMap<EventId, Vec<Box<dyn GroupIndexer>>> = HashMap::new();

        for target_group in &contract.target_groups {
            match target_group {
                GroupType::EarlyHolder => {
                    let early_holder_indexer = EarlyHolderIndexer::new(
                        contract.clone(),
                        pg_client.clone(),
                        db.clone(),
                        eth_client.clone(),
                    );
                    let erc20_indexers = indexers.entry(ERC20_TRANSFER_EVENT_ID).or_default();
                    if is_indexer_ready(&contract, &early_holder_indexer).await {
                        erc20_indexers.push(Box::new(early_holder_indexer));
                    }
                }
                GroupType::Whale => {
                    let whale_indexer = WhaleIndexer::new(
                        contract.clone(),
                        pg_client.clone(),
                        db.clone(),
                        eth_client.clone(),
                    );
                    if is_indexer_ready(&contract, &whale_indexer).await {
                        let erc20_indexers = indexers.entry(ERC20_TRANSFER_EVENT_ID).or_default();
                        erc20_indexers.push(Box::new(whale_indexer));
                    }
                }
                GroupType::AllHolders => {
                    let all_holder_indexer = AllHoldersIndexer::new(
                        contract.clone(),
                        pg_client.clone(),
                        db.clone(),
                        eth_client.clone(),
                    );
                    if is_indexer_ready(&contract, &all_holder_indexer).await {
                        let erc721_indexers = indexers.entry(ERC721_TRANSFER_EVENT_ID).or_default();
                        erc721_indexers.push(Box::new(all_holder_indexer));
                    }
                }
                GroupType::Ticker => {
                    let ticker_indexer = TickerIndexer::new(
                        contract.clone(),
                        pg_client.clone(),
                        db.clone(),
                        eth_client.clone(),
                    );
                    if is_indexer_ready(&contract, &ticker_indexer).await {
                        let erc20_indexers = indexers.entry(ERC20_TRANSFER_EVENT_ID).or_default();
                        erc20_indexers.push(Box::new(ticker_indexer));
                    }
                }
                _ => {
                    error!("Unknown target group {:?}", target_group);
                }
            }
        }

        if !indexers.is_empty() {
            // Initialize the groups
            let init_group_results =
                join_all(indexers.iter_mut().flat_map(|(_event_id, event_indexers)| {
                    event_indexers
                        .iter_mut()
                        .map(|indexer| indexer.init_group())
                        .collect::<Vec<_>>()
                }))
                .await;

            // Check if there are any errors in the initialization
            let error_exists = init_group_results.iter().any(|result| result.is_err());
            if error_exists {
                // Sleep for 5 seconds and try again
                tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                continue;
            }

            let start = Instant::now();
            let erc20_indexers = indexers.get_mut(&ERC20_TRANSFER_EVENT_ID);

            if let Some(erc20_indexers) = erc20_indexers {
                process_event_logs(&db, &contract, ERC20_TRANSFER_EVENT_ID, erc20_indexers).await;
            }

            let erc721_indexers = indexers.get_mut(&ERC721_TRANSFER_EVENT_ID);

            if let Some(erc721_indexers) = erc721_indexers {
                process_event_logs(&db, &contract, ERC721_TRANSFER_EVENT_ID, erc721_indexers).await;
            }

            info!(
                "${} {} {:?}",
                contract.symbol.to_uppercase(),
                "Processed logs for contract in ".green(),
                start.elapsed()
            );
        }

        drop(permit);

        // Sleep for 60 seconds
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
    }
}

pub async fn save_tree(
    group_id: i32,
    group_type: GroupType,
    pg_client: &tokio_postgres::Client,
    mut addresses: Vec<Address>,
    block_number: i64,
) -> Result<(), tokio_postgres::Error> {
    addresses.sort();

    let is_render = env::var("RENDER").is_ok_and(|var| var == "true");
    let is_pr = env::var("IS_PULL_REQUEST").is_ok_and(|var| var == "true");

    if !is_render || is_pr {
        let dev_addresses = dev_addresses();
        addresses.extend(dev_addresses.iter());
    }

    // If the group type is not static and the number of addresses is less than 100,
    // then we skip building the tree since the anonymity set is too small
    if group_type != GroupType::Static && addresses.len() < 100 {
        warn!("Not enough addresses to build a tree for {}", group_id);
        return Ok(());
    }

    let mut tree = MerkleTree::<Fq, TREE_WIDTH>::new(secp256k1_w3());

    let leaves = &addresses
        .iter()
        .map(|chunk| {
            let mut address = [0u8; 32];
            address[12..].copy_from_slice(chunk);
            Fq::from(BigUint::from_bytes_be(&address))
        })
        .collect::<Vec<Fq>>();

    // Pad the leaves to equal the size of the tree
    let mut padded_leaves = leaves.clone();
    padded_leaves.resize(1 << TREE_DEPTH, Fq::ZERO);

    for address in padded_leaves {
        tree.insert(address);
    }

    tree.finish();

    let merkle_root_hex = to_hex(tree.root.unwrap());

    let mut precomputed = vec![Fq::ZERO];
    for i in 0..tree.depth.unwrap() {
        let hash = MerkleTree::hash(&mut tree.poseidon, &[precomputed[i]; 2]);
        precomputed.push(hash);
    }

    let layers: Vec<MerkleTreeLayer> = tree
        .layers
        .iter()
        .enumerate()
        .map(|(layer_i, layer): (usize, &Vec<Fq>)| {
            let nodes_proto = layer
                .iter()
                .enumerate()
                .flat_map(|(i, fe)| {
                    let mut node = fe.into_bigint().to_bytes_be();

                    if *fe == precomputed[layer_i] {
                        None
                    } else {
                        if layer_i == 0 {
                            node = node[12..].to_vec();
                        }

                        Some(merkle_tree_proto::MerkleTreeNode {
                            node,
                            index: i as u32,
                        })
                    }
                })
                .collect::<Vec<merkle_tree_proto::MerkleTreeNode>>();

            merkle_tree_proto::MerkleTreeLayer { nodes: nodes_proto }
        })
        .collect();

    let tree_protobuf = merkle_tree_proto::MerkleTree { layers };
    let tree_bytes = tree_protobuf.encode_to_vec();

    // Check if the tree already exists for the given group and block number
    let statement = r#"
        SELECT "id" FROM "MerkleTree"
        WHERE "groupId" = $1 AND "blockNumber" = $2
        "#;

    let tree_exists = pg_client
        .query_opt(statement, &[&group_id, &block_number])
        .await?;

    if tree_exists.is_some() {
        info!(
            "Tree already exists for group {} and block {}",
            group_id, block_number
        );
        return Ok(());
    }

    let mut bloom = Bloom::new_for_fp_rate(addresses.len(), BLOOM_FILTER_FP_RATE);

    let sip_keys = bloom
        .sip_keys()
        .iter()
        .map(|key| {
            let mut key_bytes = vec![];

            key_bytes.extend_from_slice(&key.0.to_be_bytes());
            key_bytes.extend_from_slice(&key.1.to_be_bytes());

            key_bytes
        })
        .collect::<Vec<Vec<u8>>>();

    for address in addresses.clone() {
        bloom.set(&address);
    }

    let num_hashes = bloom.number_of_hash_functions();
    let num_bits = bloom.number_of_bits();
    let bloom_bytes = bloom.bitmap();

    println!(
        "Bloom filter: {}B",
        bloom_bytes.len().to_formatted_string(&Locale::en)
    );

    // Save the tree to the database
    let statement = r#"
        INSERT INTO "MerkleTree" ("groupId", "blockNumber", "merkleRoot", "treeProtoBuf", "bloomFilter", "bloomSipKeys", "bloomNumHashes", "bloomNumBits", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT ("groupId", "blockNumber") DO NOTHING
        "#;

    let start = Instant::now();
    pg_client
        .query(
            statement,
            &[
                &group_id,
                &block_number,
                &merkle_root_hex,
                &tree_bytes,
                &bloom_bytes,
                &sip_keys,
                &(num_hashes as i32),
                &(num_bits as i32),
            ],
        )
        .await?;

    info!(
        "Saved tree for group {} and block {} in {:?}",
        group_id,
        block_number,
        start.elapsed()
    );

    // Set bloom filter and the tree body to null for older trees

    let statement = r#"
        UPDATE "MerkleTree" SET "bloomFilter" = NULL, "treeProtoBuf" = NULL
        WHERE "groupId" = $1 AND "blockNumber" < $2
        "#;

    let start = Instant::now();
    pg_client
        .query(statement, &[&group_id, &(block_number - 100)])
        .await?;

    info!(
        "Nullified old trees for group {} and block {} in {:?}",
        group_id,
        block_number,
        start.elapsed()
    );

    Ok(())
}
