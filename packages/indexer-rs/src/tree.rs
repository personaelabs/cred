extern crate merkle_tree as merkle_tree_lib;
use crate::merkle_proof;
use crate::storage::{GroupMerkleTree, GroupMerkleTreeWithProofs, Storage};
use merkle_tree_lib::ark_ff::{BigInteger, Field, PrimeField};
use merkle_tree_lib::ark_secp256k1::Fq;
use merkle_tree_lib::poseidon::constants::secp256k1_w3;
use merkle_tree_lib::tree::{MerkleProof, MerkleTree};
use num_bigint::BigUint;
use prost::Message;
use rayon::iter::IntoParallelRefIterator;
use rayon::iter::ParallelIterator;

const TREE_DEPTH: usize = 18;
const TREE_WIDTH: usize = 3;

fn to_hex(fe: Fq) -> String {
    format!("0x{}", BigUint::from(fe.into_bigint()).to_str_radix(16))
}

pub async fn save_tree<S: Storage>(
    storage: &S,
    group_id: i32,
    mut addresses: Vec<[u8; 20]>,
    block_number: i64,
) -> Result<(), S::ErrorType> {
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

    let existing_tree = storage
        .get_tree_by_root_and_group(&merkle_root, group_id)
        .await?;

    if existing_tree.is_some() {
        println!("Tree already exists");
        // Update the block number
        storage
            .update_group_merkle_tree(GroupMerkleTree {
                merkle_root: merkle_root.clone(),
                group_id,
                block_number,
            })
            .await?;
    } else {
        // Save the Merkle proofs in chunks

        let start_time = std::time::Instant::now();

        let merkle_proofs = leaves.par_iter().map(|leaf| tree.create_proof(*leaf));

        let merkle_proofs_proto = merkle_proofs
            .map(|proof: MerkleProof<Fq>| {
                let merkle_proof_proto = merkle_proof::MerkleProof {
                    address: proof.leaf.0.to_bytes_be(),
                    indices: proof
                        .path_indices
                        .iter()
                        .map(|i| *i != 0)
                        .collect::<Vec<bool>>(),
                    siblings: proof
                        .siblings
                        .iter()
                        .map(|sibling| sibling.0.to_bytes_be())
                        .collect(),
                };

                let mut buf = vec![];
                merkle_proof_proto.encode(&mut buf).unwrap();

                buf
            })
            .collect();

        // Create a new tree
        storage
            .save_group_merkle_tree(GroupMerkleTreeWithProofs {
                merkle_root: merkle_root.clone(),
                group_id,
                block_number,
                proofs: merkle_proofs_proto,
            })
            .await?;

        let elapsed = start_time.elapsed();
        println!("Saved {} proofs in {:?}", leaves.len(), elapsed);
    }

    Ok(())
}
