use ark_ff::{BigInteger, PrimeField};
use eth_membership::build_input;
use eth_membership::eth_membership;
use eth_membership::utils::verify_efficient_ecdsa;
use num_bigint::BigUint;
use spartan::wasm::prelude::*;
use spartan::{circuit, constraint_system::ConstraintSystem};

type Curve = ark_secq256k1::Projective;

use ark_secp256k1::Affine;

// Produce the code to generate and verify the proof of the `eth_membership` circuit.
// We wrap the `prove` and `verify` functions with additional logic
// and expose them to the JavaScript runtime.
pub fn twitter_anon<F: PrimeField>(cs: &mut ConstraintSystem<F>) {
    #[cfg(target_arch = "wasm32")]
    {
        web_sys::console::log_1(&JsValue::from_str("Cal circuit"));
    }

    #[cfg(not(target_arch = "wasm32"))]
    {
        println!("Cal circuit")
    }

    eth_membership(cs);
}

circuit!(twitter_anon, Curve, b"twitter_anon");

// `TwitterAnonProof` consists of a Spartan proof
// and auxiliary inputs necessary for full verification.
// This proof is serialized and passed around in the JavaScript runtime.
#[derive(CanonicalSerialize, CanonicalDeserialize)]
pub struct TwitterAnonProof {
    pub proof: SpartanProof<Curve>,
    r: ark_secp256k1::Fq,
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
    root: &[u8],
) -> Vec<u8> {
    // Build the public and private inputs
    let (priv_input, pub_input) = build_input(
        s,
        r,
        is_y_odd,
        msg_hash,
        merkle_siblings,
        merkle_indices,
        root,
    );

    // Generate the proof
    let proof = prove(&pub_input, &priv_input);

    // Convert bytes to appropriate types
    let r = ark_secp256k1::Fq::from(BigUint::from_bytes_be(r));
    let msg_hash = BigUint::from_bytes_be(msg_hash);

    let membership_proof = TwitterAnonProof {
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
pub fn verify_membership(full_proof: &[u8]) -> bool {
    // Get the public inputs from the proof
    let full_proof = TwitterAnonProof::deserialize_compressed(full_proof).unwrap();
    let pub_inputs = full_proof.proof.pub_input.clone();

    let tx = pub_inputs[0];
    let ty = pub_inputs[1];
    let ux = pub_inputs[2];
    let uy = pub_inputs[3];

    let t = Affine::new(tx, ty);
    let u = Affine::new(ux, uy);

    let r = full_proof.r;
    let is_y_odd = full_proof.is_y_odd;
    let msg_hash = full_proof.msg_hash;

    // Verify the proof
    let is_proof_valid = verify(full_proof.proof);

    // Verify the efficient ECDSA input
    let is_efficient_ecdsa_valid = verify_efficient_ecdsa(msg_hash, r, is_y_odd, t, u);

    is_proof_valid && is_efficient_ecdsa_valid
}

// ####################################
// Helper functions
// ####################################

// Get the Merkle root from the proof's public input
#[wasm_bindgen]
pub fn get_root(creddd_proof: &[u8]) -> Vec<u8> {
    let creddd_proof = TwitterAnonProof::deserialize_compressed(creddd_proof).unwrap();
    let pub_inputs = creddd_proof.proof.pub_input.clone();
    let root = pub_inputs[4];

    root.into_bigint().to_bytes_be()
}

// Get the  message hash from the proof's public input
#[wasm_bindgen]
pub fn get_msg_hash(creddd_proof: &[u8]) -> Vec<u8> {
    let creddd_proof = TwitterAnonProof::deserialize_compressed(creddd_proof).unwrap();
    creddd_proof.msg_hash.to_bytes_be()
}

#[cfg(test)]
mod tests {
    use super::*;
    use ark_std::{end_timer, start_timer};
    use eth_membership::utils::test_utils::mock_witness_input;

    #[test]
    fn test_twitter_anon() {
        client_prepare();

        let witness_input = mock_witness_input::<ark_secq256k1::Fr>();

        let prover_timer = start_timer!(|| "prove");
        let proof = prove_membership(
            &witness_input.s,
            &witness_input.r,
            witness_input.is_y_odd,
            &witness_input.msg_hash,
            &witness_input.merkle_siblings,
            &witness_input.merkle_indices,
            &witness_input.root,
        );
        end_timer!(prover_timer);

        let verifier_timer = start_timer!(|| "verify");
        assert!(verify_membership(&proof));
        end_timer!(verifier_timer);
    }
}
