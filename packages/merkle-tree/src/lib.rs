use merkle_tree::ark_ff::{Field, PrimeField};
use merkle_tree::ark_secp256k1::Fq;
use merkle_tree::num_bigint::BigUint;
use merkle_tree::poseidon::constants::secp256k1_w3;
use merkle_tree::tree::MerkleTree;
use neon::prelude::*;
use neon::types::buffer::TypedArray;
use once_cell::sync::Lazy;
pub use std::sync::Mutex;

const WIDTH: usize = 3;
static SECP256K1_TREE: Lazy<Mutex<MerkleTree<Fq, WIDTH>>> =
    Lazy::new(|| Mutex::new(MerkleTree::new(secp256k1_w3())));

fn init_tree(mut cx: FunctionContext) -> JsResult<JsString> {
    let mut tree = SECP256K1_TREE.lock().unwrap();

    // Initialize the tree
    *tree = MerkleTree::new(secp256k1_w3());

    let leaf_bytes = cx.argument::<JsBuffer>(0)?;

    let depth = cx.argument::<JsNumber>(1)?.value(&mut cx) as u32;

    let leaves = &leaf_bytes
        .as_slice(&mut cx)
        .chunks(32)
        .map(|chunk| Fq::from(BigUint::from_bytes_be(chunk)))
        .collect::<Vec<Fq>>();

    let mut padded_leaves = leaves.clone();
    // Pad the leaves to equal the size of the tree
    padded_leaves.resize(1 << depth, Fq::ZERO);

    // Insert all leaves into the tree
    for leaf in &padded_leaves {
        tree.insert(*leaf);
    }

    tree.finish();

    Ok(cx.string(tree.root.unwrap().into_bigint().to_string()))
}

pub fn create_proof(mut cx: FunctionContext) -> JsResult<JsString> {
    let leaf_bytes = cx.argument::<JsBuffer>(0)?;
    let leaf_bytes = leaf_bytes.as_slice(&mut cx);

    let tree = SECP256K1_TREE.lock().unwrap();
    let leaf = Fq::from(BigUint::from_bytes_be(leaf_bytes));
    let proof = tree.create_proof(leaf);
    Ok(cx.string(proof.to_json()))
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("init_tree", init_tree)?;
    cx.export_function("create_proof", create_proof)?;
    Ok(())
}
