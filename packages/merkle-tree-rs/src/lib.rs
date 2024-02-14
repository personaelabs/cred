use merkle_tree::ark_ff::{Field, PrimeField};
use merkle_tree::ark_secp256k1::Fq;
use merkle_tree::num_bigint::BigUint;
use merkle_tree::poseidon::constants::secp256k1_w3;
use merkle_tree::tree::MerkleTree;
use neon::prelude::*;
use neon::types::buffer::TypedArray;

pub use std::sync::Mutex;
const WIDTH: usize = 3;

fn init_tree(mut cx: FunctionContext) -> JsResult<JsArrayBuffer> {
    // Initialize the tree
    let mut tree = MerkleTree::<Fq, WIDTH>::new(secp256k1_w3());

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

    let tree_bytes = tree.serialize();

    let mut buf = cx.array_buffer(tree_bytes.len())?;
    buf.as_mut_slice(&mut cx).copy_from_slice(&tree_bytes);

    Ok(buf)
}

pub fn get_root(mut cx: FunctionContext) -> JsResult<JsString> {
    let tree_bytes = cx.argument::<JsBuffer>(0)?;
    let tree_bytes = tree_bytes.as_slice(&mut cx);

    let tree = MerkleTree::<Fq, WIDTH>::from_compressed_bytes(&tree_bytes);
    Ok(cx.string(tree.root.unwrap().into_bigint().to_string()))
}

pub fn create_proof(mut cx: FunctionContext) -> JsResult<JsString> {
    let tree_bytes = cx.argument::<JsBuffer>(1)?;
    let tree_bytes = tree_bytes.as_slice(&mut cx);

    let tree = MerkleTree::<Fq, WIDTH>::from_compressed_bytes(&tree_bytes);
    let leaf_bytes = cx.argument::<JsBuffer>(0)?;
    let leaf_bytes = leaf_bytes.as_slice(&mut cx);

    let leaf = Fq::from(BigUint::from_bytes_be(leaf_bytes));
    let proof = tree.create_proof(leaf);
    Ok(cx.string(proof.to_json()))
}

pub fn create_proofs(mut cx: FunctionContext) -> JsResult<JsArray> {
    let tree_bytes = cx.argument::<JsBuffer>(1)?;
    let tree_bytes = tree_bytes.as_slice(&mut cx);

    let tree = MerkleTree::<Fq, WIDTH>::from_compressed_bytes(&tree_bytes);
    let leaves_bytes = cx.argument::<JsBuffer>(0)?;
    let leaves_bytes = leaves_bytes.as_slice(&mut cx);

    let proofs = leaves_bytes
        .chunks(32)
        .map(|chunk| {
            let leaf = Fq::from(BigUint::from_bytes_be(chunk));
            tree.create_proof(leaf).to_json()
        })
        .collect::<Vec<String>>();

    let proofs_js = JsArray::new(&mut cx, proofs.len() as u32);
    for (i, proof) in proofs.iter().enumerate() {
        let js_proof = cx.string(proof);
        proofs_js.set(&mut cx, i as u32, js_proof).unwrap();
    }

    Ok(proofs_js)
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("init_tree", init_tree)?;
    cx.export_function("get_root", get_root)?;
    cx.export_function("create_proof", create_proof)?;
    cx.export_function("create_proofs", create_proofs)?;
    Ok(())
}
