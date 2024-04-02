extern crate merkle_tree as merkle_tree_lib;
use crate::merkle_tree_proto::{self, MerkleTreeLayer};
use crate::utils::dev_addresses;
use crate::{Address, BlockNum, GroupId, GroupType};
use bloomfilter::Bloom;
use log::{info, warn};
use merkle_tree_lib::ark_ff::{BigInteger, Field, PrimeField};
use merkle_tree_lib::ark_secp256k1::Fq;
use merkle_tree_lib::poseidon::constants::secp256k1_w3;
use merkle_tree_lib::tree::MerkleTree;
use num_bigint::BigUint;
use prost::Message;
use std::env;
use std::time::Instant;

const TREE_DEPTH: usize = 18;
const TREE_WIDTH: usize = 3;
const BLOOM_FILTER_FP_RATE: f64 = 0.005;

fn to_hex(fe: Fq) -> String {
    format!("0x{}", BigUint::from(fe.into_bigint()).to_str_radix(16))
}

/// Returns the latest merkle root for a group
pub async fn get_group_latest_merkle_tree(
    group_id: GroupId,
    pg_client: &tokio_postgres::Client,
) -> Result<Option<(i32, String)>, tokio_postgres::Error> {
    let statement = r#"
    SELECT
            "id",
            "merkleRoot"
        FROM
            "MerkleTree"
        WHERE
            "groupId" = $1
        ORDER BY
            "blockNumber" DESC
        LIMIT 1
        "#;

    let result = pg_client.query(statement, &[&group_id]).await?;

    if result.len() == 0 {
        return Ok(None);
    } else {
        let tree_id: i32 = result[0].get("id");
        let merkle_root: String = result[0].get("merkleRoot");
        Ok(Some((tree_id, merkle_root)))
    }
}

/// Build a merkle tree from a list of addresses
pub fn build_tree(
    group_id: GroupId,
    group_type: GroupType,
    addresses: &mut Vec<Address>,
) -> Option<MerkleTree<Fq, TREE_WIDTH>> {
    addresses.sort();

    let is_render = env::var("RENDER").is_ok_and(|var| var == "true");
    let is_pr = env::var("IS_PULL_REQUEST").is_ok_and(|var| var == "true");

    if !is_render || is_pr {
        let dev_addresses = dev_addresses();
        addresses.extend(dev_addresses.iter());
    }

    // If the group type is not static and the number of addresses is less than 100,
    // then we skip building the tree since the anonymity set is too small
    if group_type != GroupType::CredddTeam && addresses.len() < 100 {
        // TODO: Return an error here so that the caller can decide what to do
        warn!("Not enough addresses to build a tree for {}", group_id);
        None
    } else {
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

        Some(tree)
    }
}

pub async fn update_tree_block_num(
    tree_id: i32,
    block_number: BlockNum,
    pg_client: &tokio_postgres::Client,
) -> Result<(), tokio_postgres::Error> {
    let statement = r#"
        UPDATE "MerkleTree" SET "blockNumber" = $1
        WHERE "id" = $2
        "#;

    pg_client
        .query(statement, &[&(block_number as i64), &tree_id])
        .await?;

    Ok(())
}

pub async fn save_tree(
    addresses: &[Address],
    tree: MerkleTree<Fq, TREE_WIDTH>,
    group_id: GroupId,
    pg_client: &tokio_postgres::Client,
    block_number: i64,
) -> Result<(), tokio_postgres::Error> {
    let mut poseidon = tree.poseidon.clone();
    let merkle_root_hex = to_hex(tree.root.unwrap());

    let mut precomputed = vec![Fq::ZERO];
    for i in 0..tree.depth.unwrap() {
        let hash = MerkleTree::hash(&mut poseidon, &[precomputed[i]; 2]);
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

    for address in addresses {
        bloom.set(address);
    }

    let num_hashes = bloom.number_of_hash_functions();
    let num_bits = bloom.number_of_bits();
    let bloom_bytes = bloom.bitmap();
    let num_leaves = addresses.len() as i32;

    // Save the tree to the database
    let statement = r#"
        INSERT INTO "MerkleTree" ("groupId", "blockNumber", "merkleRoot", "treeProtoBuf", "bloomFilter", "bloomSipKeys", "bloomNumHashes", "bloomNumBits", "numLeaves", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
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
                &(num_leaves as i32),
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
        .query(statement, &[&group_id, &(block_number - 2000)])
        .await?;

    info!(
        "Nullified old trees for group {} and block {} in {:?}",
        group_id,
        block_number,
        start.elapsed()
    );

    Ok(())
}
