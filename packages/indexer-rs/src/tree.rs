extern crate merkle_tree as merkle_tree_lib;
use crate::contract::Contract;
use crate::eth_rpc::EthRpcClient;
use crate::merkle_tree_proto::{self, MerkleTreeLayer};
use crate::processors::all_holders::AllHoldersIndexer;
use crate::processors::early_holders::EarlyHolderIndexer;
use crate::processors::whales::WhaleIndexer;
use crate::processors::GroupIndexer;
use crate::rocksdb_key::{KeyType, RocksDbKey, ERC20_TRANSFER_EVENT_ID, ERC721_TRANSFER_EVENT_ID};
use colored::*;
use futures::future::join_all;
use log::{error, info};
use merkle_tree_lib::ark_ff::{BigInteger, Field, PrimeField};
use merkle_tree_lib::ark_secp256k1::Fq;
use merkle_tree_lib::poseidon::constants::secp256k1_w3;
use merkle_tree_lib::tree::MerkleTree;
use num_bigint::BigUint;
use prost::Message;
use rocksdb::{IteratorMode, ReadOptions, DB};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Instant;
const TREE_DEPTH: usize = 18;
const TREE_WIDTH: usize = 3;

fn to_hex(fe: Fq) -> String {
    format!("0x{}", BigUint::from(fe.into_bigint()).to_str_radix(16))
}

async fn process_event_logs(
    db: &DB,
    contract: &Contract,
    event_id: u16,
    indexers: &mut Vec<Box<dyn GroupIndexer>>,
) {
    let start = Instant::now();
    // Initialize the RocksDB iterator that starts from the first log for `contract.id`
    let mut iterator_ops = ReadOptions::default();
    iterator_ops.set_async_io(true);

    let start_key = RocksDbKey::new_start_key(KeyType::EventLog, event_id, contract.id);

    // Initialize the RocksDB prefix iterator (i.e. the iterator starts from key [contract_id, 0, 0, 0, 0,  ... 0])
    let iterator = db.iterator_opt(
        IteratorMode::From(&start_key.to_bytes(), rocksdb::Direction::Forward),
        iterator_ops,
    );

    let mut latest_block_num = None;

    let mut errored_indexers = vec![];
    for item in iterator {
        let (key, value) = item.unwrap();
        let key = RocksDbKey::from_bytes(key.as_ref().try_into().unwrap());

        if key.key_type == KeyType::EventLog
            && key.contract_id == contract.id
            && key.event_id == event_id
        {
            // Run the log through the indexers
            for (i, indexer) in indexers.iter_mut().enumerate() {
                if errored_indexers.contains(&i) {
                    continue;
                }

                let result = indexer.process_log(&value);
                if let Err(err) = result {
                    error!(
                        "${} {} Error processing logs for contract {:?}",
                        contract.symbol.to_uppercase(),
                        indexer.group_name(),
                        err
                    );

                    errored_indexers.push(i);
                }
            }

            latest_block_num = Some(key.block_num.unwrap());
        } else {
            break;
        }
    }

    info!(
        "${} Iterated through logs in {:?}",
        contract.symbol.to_uppercase(),
        start.elapsed()
    );

    if let Some(latest_block_num) = latest_block_num {
        let save_trees_start = Instant::now();

        // Run `save_tree` for each indexer
        for indexer in indexers {
            let result = indexer.save_tree(latest_block_num as i64).await;
            if let Err(err) = result {
                error!(
                    "${} {} Error saving tree for contract {:?}",
                    contract.symbol.to_uppercase(),
                    indexer.group_name(),
                    err
                );
            }

            info!(
                "${} Saved tree for '{}' in {:?}",
                contract.symbol.to_uppercase(),
                indexer.group_name(),
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
                indexer.group_name()
            );
            false
        }
    } else {
        error!(
            "${} {} Error checking if indexer is ready {}",
            contract.symbol.to_uppercase(),
            indexer.group_name(),
            is_indexer_ready.unwrap_err()
        );
        false
    }
}

pub async fn index_groups_for_contract(
    pg_client: Arc<tokio_postgres::Client>,
    db: Arc<DB>,
    eth_client: Arc<EthRpcClient>,
    contract: Contract,
) {
    loop {
        let mut indexers: HashMap<u16, Vec<Box<dyn GroupIndexer>>> = HashMap::new();

        for target_group in &contract.target_groups {
            match target_group.as_str() {
                "earlyHolder" => {
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
                "whale" => {
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
                "allHolders" => {
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
                _ => {
                    error!("Unknown target group {}", target_group);
                }
            }
        }

        // Initialize the groups
        let start = Instant::now();
        let init_group_results =
            join_all(indexers.iter_mut().flat_map(|(_event_id, event_indexers)| {
                event_indexers
                    .iter_mut()
                    .map(|indexer| indexer.init_group())
                    .collect::<Vec<_>>()
            }))
            .await;

        println!(
            "${} {} {:?}",
            contract.symbol.to_uppercase(),
            "Initialized groups in ".green(),
            start.elapsed()
        );

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

        if !indexers.is_empty() {
            info!(
                "${} {} {:?}",
                contract.symbol.to_uppercase(),
                "Processed logs for contract in ".green(),
                start.elapsed()
            );
        }

        // Sleep for 60 seconds
        tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
    }
}

pub async fn save_tree(
    group_id: i32,
    pg_client: &tokio_postgres::Client,
    mut addresses: Vec<[u8; 20]>,
    block_number: i64,
) -> Result<(), tokio_postgres::Error> {
    addresses.sort();

    if block_number != 0 && addresses.len() < 100 {
        info!("Not enough addresses to build a tree for {}", group_id);
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
                .filter(|fe| **fe != precomputed[layer_i])
                .enumerate()
                .map(|(i, fe)| {
                    let mut node = fe.into_bigint().to_bytes_be();

                    if layer_i == 0 {
                        node = node[12..].to_vec();
                    }

                    merkle_tree_proto::MerkleTreeNode {
                        node,
                        index: i as u32,
                    }
                })
                .collect::<Vec<merkle_tree_proto::MerkleTreeNode>>();

            merkle_tree_proto::MerkleTreeLayer { nodes: nodes_proto }
        })
        .collect();

    let tree_protobuf = merkle_tree_proto::MerkleTree { layers };
    let tree_bytes = tree_protobuf.encode_to_vec();

    println!("tree bytes: {}", tree_bytes.len());

    // Save the tree to the database
    let statement = r#"
        INSERT INTO "MerkleTree2" ("groupId", "blockNumber", "merkleRoot", "treeProtoBuf", "updatedAt")
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT ("groupId", "blockNumber", "merkleRoot") DO NOTHING"#;

    pg_client
        .query(
            statement,
            &[&group_id, &block_number, &merkle_root_hex, &tree_bytes],
        )
        .await?;

    // Save the leaves to the database
    let mut statement = r#"
        INSERT INTO "MerkleTreeLeaf" ("groupId", "blockNumber", "address", "updatedAt")
        VALUES
       "#
    .to_string();

    for address in &addresses {
        let address_hex = format!("0x{}", hex::encode(address.clone()));
        statement += format!(
            "({}, {}, '{}', NOW()),",
            group_id, block_number, address_hex
        )
        .as_str();
    }

    statement.pop(); // Remove the trailing comma

    statement += r#"ON CONFLICT ("groupId", "blockNumber", "address") DO NOTHING"#;

    pg_client.query(statement.as_str(), &[]).await?;

    // Delete all past leaves
    let statement = r#"
        DELETE FROM "MerkleTreeLeaf" WHERE "groupId" = $1 AND "blockNumber" < $2
       "#;

    pg_client
        .query(statement, &[&group_id, &block_number])
        .await?;

    Ok(())
}
