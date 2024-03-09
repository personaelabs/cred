extern crate merkle_tree as merkle_tree_lib;
use std::sync::Arc;

use crate::merkle_tree_proto;
use merkle_tree_lib::ark_ff::{BigInteger, Field, PrimeField};
use merkle_tree_lib::ark_secp256k1::Fq;
use merkle_tree_lib::poseidon::constants::secp256k1_w3;
use merkle_tree_lib::tree::MerkleTree;
use num_bigint::BigUint;
use prost::Message;

const TREE_DEPTH: usize = 18;
const TREE_WIDTH: usize = 3;

fn to_hex(fe: Fq) -> String {
    format!("0x{}", BigUint::from(fe.into_bigint()).to_str_radix(16))
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
