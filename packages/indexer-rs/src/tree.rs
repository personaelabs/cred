extern crate merkle_tree as merkle_tree_lib;
use crate::prisma::{group, merkle_tree};
use crate::prisma::{merkle_proof, PrismaClient};
use merkle_tree_lib::ark_ff::{Field, PrimeField};
use merkle_tree_lib::ark_secp256k1::Fq;
use merkle_tree_lib::poseidon::constants::secp256k1_w3;
use merkle_tree_lib::tree::{MerkleProof, MerkleTree};
use num_bigint::BigUint;
use prisma_client_rust::prisma_models::PrismaListValue;
use prisma_client_rust::{raw, PrismaValue, QueryError};
use rayon::iter::IntoParallelRefIterator;
use rayon::iter::ParallelIterator;

const TREE_DEPTH: usize = 18;
const TREE_WIDTH: usize = 3;

fn to_hex(fe: Fq) -> String {
    format!("0x{}", BigUint::from(fe.into_bigint()).to_str_radix(16))
}

pub async fn save_tree(
    prisma_client: &PrismaClient,
    group_id: i32,
    mut addresses: Vec<[u8; 20]>,
    block_number: u64,
) -> Result<(), QueryError> {
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

    let start_time = std::time::Instant::now();
    tree.finish();
    let elapsed = start_time.elapsed();
    println!("Tree built in {:?}", elapsed);

    let merkle_root = to_hex(tree.root.unwrap());

    let existing_tree = prisma_client
        .merkle_tree()
        .find_first(vec![
            merkle_tree::group_id::equals(group_id),
            merkle_tree::merkle_root::equals(merkle_root.clone()),
        ])
        .exec()
        .await?;

    if existing_tree.is_some() {
        println!("Tree already exists");
        // Update the block number
        prisma_client
            .merkle_tree()
            .update(
                merkle_tree::id::equals(existing_tree.unwrap().id),
                vec![merkle_tree::block_number::set(block_number as i64)],
            )
            .exec()
            .await?;
    } else {
        // Create a new tree
        let new_merkle_tree = prisma_client
            .merkle_tree()
            .create(
                merkle_root,
                r#group::id::equals(group_id),
                block_number as i64,
                vec![],
            )
            .exec()
            .await?;

        // Save the Merkle proofs in chunks
        let chunk_size = 10000;

        let start_time = std::time::Instant::now();
        for chunk in leaves.chunks(chunk_size) {
            let proofs = chunk.par_iter().map(|leaf| tree.create_proof(*leaf));

            prisma_client
                .merkle_proof()
                .create_many(
                    proofs
                        .map(|proof: MerkleProof<Fq>| {
                            merkle_proof::create_unchecked(
                                to_hex(proof.leaf),
                                new_merkle_tree.id,
                                vec![
                                    merkle_proof::path_indices::set(
                                        proof.path_indices.iter().map(|i| *i as i32).collect(),
                                    ),
                                    merkle_proof::path::set(
                                        proof
                                            .siblings
                                            .iter()
                                            .map(|sibling| to_hex(*sibling))
                                            .collect(),
                                    ),
                                ],
                            )
                        })
                        .collect(),
                )
                .exec()
                .await?;
        }

        let elapsed = start_time.elapsed();
        println!("Saved {} proofs in {:?}", leaves.len(), elapsed);

        let start_time = std::time::Instant::now();
        // Get all Merkle trees for the group except the one we just created
        let old_trees = prisma_client
            .merkle_tree()
            .find_many(vec![
                merkle_tree::group_id::equals(group_id),
                merkle_tree::id::not(new_merkle_tree.id),
            ])
            .exec()
            .await?;

        let old_tree_ids = old_trees.iter().map(|tree| tree.id).collect::<Vec<i32>>();
        println!("Found {} old trees", old_tree_ids.len());

        if !old_tree_ids.is_empty() {
            let comma_separated = old_tree_ids
                .iter()
                .map(|&num| format!("{}", num)) // Convert each integer to String
                .collect::<Vec<_>>() // Collect into a Vec<String>
                .join(", "); // Join with commas

            let query = format!(
                "DELETE FROM \"MerkleProof\" WHERE \"treeId\" IN ({})",
                comma_separated
            );

            // Delete the Merkle proofs of the old trees.
            let del_result = prisma_client
                ._execute_raw(raw!(&query))
                .exec()
                .await
                .unwrap();

            println!(
                "Deleted {} old proofs in {:?}",
                del_result,
                start_time.elapsed()
            );
        }
    }

    Ok(())
}
