extern crate merkle_tree as merkle_tree_lib;
use crate::contract::Contract;
use crate::eth_rpc::EthRpcClient;
use crate::merkle_tree_proto;
use crate::processors::early_holders::EarlyHolderIndexer;
use crate::processors::whales::WhaleIndexer;
use crate::processors::GroupIndexer;
use crate::rocksdb_key::{KeyType, RocksDbKey, ERC20_TRANSFER_EVENT_ID};
use crate::{erc20_transfer_event, TransferEvent};
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
use std::sync::Arc;
use std::{io::Cursor, time::Instant};

const TREE_DEPTH: usize = 18;
const TREE_WIDTH: usize = 3;

fn to_hex(fe: Fq) -> String {
    format!("0x{}", BigUint::from(fe.into_bigint()).to_str_radix(16))
}

pub async fn index_groups_for_contract(
    pg_client: Arc<tokio_postgres::Client>,
    db: Arc<DB>,
    eth_client: Arc<EthRpcClient>,
    contract: Contract,
) {
    loop {
        let early_holder_indexer = EarlyHolderIndexer::new(
            contract.clone(),
            pg_client.clone(),
            db.clone(),
            eth_client.clone(),
        );

        let whale_indexer = WhaleIndexer::new(
            contract.clone(),
            pg_client.clone(),
            db.clone(),
            eth_client.clone(),
        );

        let indexers: Vec<Box<dyn GroupIndexer>> =
            vec![Box::new(early_holder_indexer), Box::new(whale_indexer)];

        let mut ready_indexers: Vec<Box<dyn GroupIndexer>> = vec![];

        // Filter out the indexers that are not ready and create a list of ready indexers
        for indexer in indexers {
            let is_indexer_ready = indexer.is_ready().await;
            if let Ok(is_indexer_ready) = is_indexer_ready {
                if is_indexer_ready {
                    ready_indexers.push(indexer);
                } else {
                    info!(
                        "${} Indexer for '{}' is waiting...",
                        contract.symbol.to_uppercase(),
                        indexer.group_name()
                    );
                }
            } else {
                error!(
                    "${} {} Error checking if indexer is ready {}",
                    contract.symbol.to_uppercase(),
                    indexer.group_name(),
                    is_indexer_ready.unwrap_err()
                );
            }
        }

        // Initialize the groups
        let init_group_results = join_all(
            ready_indexers
                .iter_mut()
                .map(|indexer| indexer.init_group()),
        )
        .await;

        // Check if there are any errors in the initialization
        let error_exists = init_group_results.iter().any(|result| result.is_err());
        if error_exists {
            // Sleep for 5 seconds and try again
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            continue;
        }

        // Initialize the RocksDB iterator that starts from the first log for `contract.id`
        let mut iterator_ops = ReadOptions::default();
        iterator_ops.set_async_io(true);

        let start_key =
            RocksDbKey::new_start_key(KeyType::EventLog, ERC20_TRANSFER_EVENT_ID, contract.id);

        // Initialize the RocksDB prefix iterator (i.e. the iterator starts from key [contract_id, 0, 0, 0, 0,  ... 0])
        let iterator = db.iterator_opt(
            IteratorMode::From(&start_key.to_bytes(), rocksdb::Direction::Forward),
            iterator_ops,
        );

        let start = Instant::now();
        let mut last_block_num = None;
        for item in iterator {
            let (key, value) = item.unwrap();
            let key = RocksDbKey::from_bytes(key.as_ref().try_into().unwrap());

            if key.key_type == KeyType::EventLog
                && key.contract_id == contract.id
                && key.event_id == ERC20_TRANSFER_EVENT_ID
            {
                // Decode the log.  The log is in protobuf.
                let decoded =
                    erc20_transfer_event::Erc20TransferEvent::decode(&mut Cursor::new(&value))
                        .unwrap();

                let log = TransferEvent {
                    from: decoded.from.try_into().unwrap(),
                    to: decoded.to.try_into().unwrap(),
                    value: BigUint::from_bytes_be(&decoded.value),
                };

                // Run the log through the indexers
                let mut errored_indexers = vec![];
                for (i, indexer) in ready_indexers.iter_mut().enumerate() {
                    let result = indexer.process_log(&log);
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

                // Remove the errored indexers
                for i in errored_indexers.iter() {
                    ready_indexers.remove(*i);
                }

                last_block_num = Some(key.block_num.unwrap());
            } else {
                break;
            }
        }

        if let Some(last_block_num) = last_block_num {
            let save_trees_start = Instant::now();

            // Run `save_tree` for each indexer
            for indexer in &ready_indexers {
                let result = indexer.save_tree(last_block_num as i64).await;
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
        }

        if !ready_indexers.is_empty() {
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
    pg_client: Arc<tokio_postgres::Client>,
    mut addresses: Vec<[u8; 20]>,
    block_number: i64,
) -> Result<(), tokio_postgres::Error> {
    addresses.sort();

    let mut tree = MerkleTree::<Fq, TREE_WIDTH>::new(secp256k1_w3());

    let leaves = &addresses
        .iter()
        .map(|chunk| Fq::from(BigUint::from_bytes_be(chunk)))
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

    let layers_bytes: Vec<Vec<u8>> = tree
        .layers
        .iter()
        .enumerate()
        .map(|(i, layer): (usize, &Vec<Fq>)| {
            let layer_precomputed = precomputed[i];

            let non_zero_nodes = layer.iter().filter(|fe| **fe != layer_precomputed).copied();

            let nodes_proto = non_zero_nodes
                .map(|fe| merkle_tree_proto::MerkleTreeNode {
                    node: fe.0.to_bytes_be(),
                })
                .collect::<Vec<merkle_tree_proto::MerkleTreeNode>>();

            let layer_proto = merkle_tree_proto::MerkleTreeLayer { nodes: nodes_proto };

            layer_proto.encode_to_vec()
        })
        .collect();

    // Save the tree to the database
    let statement = r#"
        INSERT INTO "MerkleTree2" ("groupId", "blockNumber", "merkleRoot", "layers", "updatedAt")
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT ("groupId", "blockNumber", "merkleRoot") DO NOTHING"#;

    pg_client
        .query(
            statement,
            &[&group_id, &block_number, &merkle_root_hex, &layers_bytes],
        )
        .await?;

    Ok(())
}
