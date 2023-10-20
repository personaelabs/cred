mod eth_membership;
mod utils;

use crate::utils::{efficient_ecdsa, verify_efficient_ecdsa};
use ark_ff::BigInteger;
use ark_secp256k1::{Affine, Fq, Fr};
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};
use eth_membership::{eth_membership, to_cs_field, NUM_MERKLE_PROOFS, TREE_DEPTH};
use num_bigint::BigUint;
use sapir::constraint_system::ConstraintSystem;
use sapir::{circuit, wasm::prelude::*};

type Curve = sapir::ark_secq256k1::Projective;
type F = ark_secq256k1::Fr;

// Produce the code to generate and verify the proof of the `eth_membership` circuit.
// We wrap the `prove` and `verify` functions with additional logic
// and expose them to the JavaScript runtime.
circuit!(
    |cs: &mut ConstraintSystem<F>| { eth_membership(cs) },
    Curve,
    b"creddd"
);

// `MembershipProof` consists of a Spartan proof
// and auxiliary inputs necessary for full verification.
// This proof is serialized and passed around in the JavaScript runtime.
#[derive(CanonicalSerialize, CanonicalDeserialize)]
pub struct MembershipProof {
    pub proof: Vec<u8>,
    r: Fq,
    is_y_odd: bool,
    msg_hash: BigUint,
}

#[wasm_bindgen]
pub fn prove_membership(
    s: &[u8],
    r: &[u8],
    is_y_odd: bool,
    msg_hash: &[u8],
    merkle_siblings: &[u8],
    merkle_indices: &[u8],
    roots: &[u8],
) -> Vec<u8> {
    assert!(merkle_siblings.len() == NUM_MERKLE_PROOFS * TREE_DEPTH * 32);
    assert!(merkle_indices.len() == NUM_MERKLE_PROOFS * TREE_DEPTH * 32);
    assert!(roots.len() == NUM_MERKLE_PROOFS * 32);

    // Deserialize the inputs
    let s = Fr::from(BigUint::from_bytes_be(s));
    let r = Fq::from(BigUint::from_bytes_be(r));
    let msg_hash = BigUint::from_bytes_be(msg_hash);

    let merkle_siblings = merkle_siblings
        .to_vec()
        .chunks(32)
        .map(|sibling| F::from(BigUint::from_bytes_be(&sibling)))
        .collect::<Vec<F>>();

    let merkle_indices = merkle_indices
        .to_vec()
        .chunks(32)
        .map(|index| F::from(BigUint::from_bytes_be(&index)))
        .collect::<Vec<F>>();

    let roots = roots
        .to_vec()
        .chunks(32)
        .map(|root| F::from(BigUint::from_bytes_be(root)))
        .collect::<Vec<F>>();

    // Compute the efficient ECDSA input
    let (u, t) = efficient_ecdsa(msg_hash.clone(), r, is_y_odd);

    // Construct the private input
    let mut priv_input = vec![];

    let s_bits = s
        .into_bigint()
        .to_bits_le()
        .iter()
        .map(|b| F::from(*b))
        .collect::<Vec<F>>();

    priv_input.extend_from_slice(&s_bits);

    // Append the Merkle indices and siblings to the private input
    for i in 0..NUM_MERKLE_PROOFS {
        priv_input.extend_from_slice(&merkle_indices[i * TREE_DEPTH..((i + 1) * TREE_DEPTH)]);
        priv_input.extend_from_slice(&merkle_siblings[i * TREE_DEPTH..((i + 1) * TREE_DEPTH)]);
    }

    // Convert the private input to bytes
    let priv_input = priv_input
        .iter()
        .flat_map(|x| x.into_bigint().to_bytes_be())
        .collect::<Vec<u8>>();

    // Construct the public input
    let mut pub_input = vec![
        to_cs_field(t.x),
        to_cs_field(t.y),
        to_cs_field(u.x),
        to_cs_field(u.y),
    ];

    // Append the Merkle roots to the public input
    for root in roots {
        pub_input.push(to_cs_field(root));
    }

    let pub_input = pub_input
        .iter()
        .flat_map(|x| x.into_bigint().to_bytes_be())
        .collect::<Vec<u8>>();

    // Generate the proof
    let proof = prove(&pub_input, &priv_input);

    let membership_proof = MembershipProof {
        proof,
        r,
        is_y_odd,
        msg_hash,
    };

    // Serialize the full proof
    let mut membership_proof_bytes = Vec::new();
    membership_proof
        .serialize_compressed(&mut membership_proof_bytes)
        .unwrap();

    membership_proof_bytes
}

#[wasm_bindgen]
pub fn verify_membership(creddd_proof: &[u8]) -> bool {
    // Get the public inputs from the proof
    let creddd_proof = MembershipProof::deserialize_compressed(creddd_proof).unwrap();
    let spartan_proof =
        SpartanProof::<Curve>::deserialize_compressed(creddd_proof.proof.as_slice()).unwrap();
    let pub_inputs = spartan_proof.pub_input.clone();

    let tx = pub_inputs[0];
    let ty = pub_inputs[1];
    let ux = pub_inputs[2];
    let uy = pub_inputs[3];

    let t = Affine::new(tx, ty);
    let u = Affine::new(ux, uy);

    let r = creddd_proof.r;
    let is_y_odd = creddd_proof.is_y_odd;
    let msg_hash = creddd_proof.msg_hash;

    // Verify the proof
    let is_proof_valid = verify(&creddd_proof.proof);

    // Verify the efficient ECDSA input
    let is_efficient_ecdsa_valid = verify_efficient_ecdsa(msg_hash, r, is_y_odd, t, u);

    is_proof_valid && is_efficient_ecdsa_valid
}

// ####################################
// Helper functions
// ####################################

// Get the Merkle root from the proof's public input
#[wasm_bindgen]
pub fn get_roots(creddd_proof: &[u8]) -> Vec<u8> {
    let creddd_proof = MembershipProof::deserialize_compressed(creddd_proof).unwrap();
    let spartan_proof =
        SpartanProof::<Curve>::deserialize_compressed(creddd_proof.proof.as_slice()).unwrap();
    let pub_inputs = spartan_proof.pub_input.clone();
    // The first 4 elements of the public input are the efficient ECDSA inputs
    let roots = &pub_inputs[4..];

    roots
        .iter()
        .flat_map(|x| x.into_bigint().to_bytes_be())
        .collect()
}

// Get the  message hash from the proof's public input
#[wasm_bindgen]
pub fn get_msg_hash(creddd_proof: &[u8]) -> Vec<u8> {
    let creddd_proof = MembershipProof::deserialize_compressed(creddd_proof).unwrap();
    creddd_proof.msg_hash.to_bytes_be()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::test_utils::mock_sig;
    use ark_ff::BigInteger;
    use ark_std::{end_timer, start_timer};
    use eth_membership::TREE_DEPTH;
    use num_bigint::BigUint;
    use sapir::{
        merkle_tree::{MerkleProof, MerkleTree},
        poseidon::constants::secp256k1_w3,
    };

    #[test]
    fn bench_eth_membership() {
        prepare();

        let (s, r, is_y_odd, msg_hash, _, address) = mock_sig(42);
        let address = F::from(BigUint::from_bytes_be(&address.to_fixed_bytes()));

        // Construct a mock tree
        let mut leaves = vec![address];
        for i in 0..(2usize.pow(TREE_DEPTH as u32) - 1) {
            leaves.push(F::from(i as u32));
        }

        let mut tree: MerkleTree<_, 3> = MerkleTree::<F, 3>::new(secp256k1_w3());
        for leaf in &leaves {
            tree.insert(*leaf);
        }

        tree.finish();

        let mut merkle_proofs = Vec::<MerkleProof<F>>::with_capacity(NUM_MERKLE_PROOFS);

        for _ in 0..NUM_MERKLE_PROOFS {
            merkle_proofs.push(tree.create_proof(address));
        }

        let s_bytes = s.into_bigint().to_bytes_be();
        let r_bytes = r.into_bigint().to_bytes_be();
        let msg_hash = msg_hash.to_bytes_be();

        let mut merkle_siblings = Vec::with_capacity(NUM_MERKLE_PROOFS * TREE_DEPTH);
        let mut merkle_indices = Vec::with_capacity(NUM_MERKLE_PROOFS * TREE_DEPTH);
        for merkle_proof in merkle_proofs {
            let siblings_bytes = merkle_proof
                .siblings
                .iter()
                .flat_map(|sibling| sibling.into_bigint().to_bytes_be())
                .collect::<Vec<u8>>();

            merkle_siblings.extend_from_slice(&siblings_bytes);

            let indices_bytes = merkle_proof
                .path_indices
                .iter()
                .map(|i| F::from(*i as u32).into_bigint().to_bytes_be())
                .flatten()
                .collect::<Vec<u8>>();

            merkle_indices.extend_from_slice(&indices_bytes);
        }

        let root = tree.root.unwrap().into_bigint().to_bytes_be();

        let mut roots = vec![];

        for _ in 0..NUM_MERKLE_PROOFS {
            roots.extend_from_slice(&root);
        }

        let prover_timer = start_timer!(|| "prove");
        let proof = prove_membership(
            &s_bytes,
            &r_bytes,
            is_y_odd,
            &msg_hash,
            &merkle_siblings,
            &merkle_indices,
            &roots,
        );
        end_timer!(prover_timer);

        let verifier_timer = start_timer!(|| "verify");
        assert!(verify_membership(&proof));
        end_timer!(verifier_timer);
    }
}
