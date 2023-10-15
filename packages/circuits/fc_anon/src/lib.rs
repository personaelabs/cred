use ark_ff::{BigInteger, PrimeField};
use eth_membership::eth_membership;
use eth_membership::utils::verify_efficient_ecdsa;
use eth_membership::{build_input, TREE_DEPTH};
use num_bigint::BigUint;
use spartan::wasm::prelude::*;
use spartan::{circuit, constraint_system::ConstraintSystem};

type Curve = ark_secq256k1::Projective;

use ark_secp256k1::Affine;

// Produce the code to generate and verify the proof of the `eth_membership` circuit.
// We wrap the `prove` and `verify` functions with additional logic
// and expose them to the JavaScript runtime.
pub fn fc_anon<F: PrimeField>(cs: &mut ConstraintSystem<F>) {
    // `s` part of the fc account signature.
    let s = cs.alloc_pub_input();

    let s_squared = s * s;

    s_squared.println();

    cs.expose_public(s_squared);

    eth_membership(cs);
}

circuit!(fc_anon, ark_secq256k1::Projective, b"fc_anon");

// `FcAnonProf` consists of a Spartan proof
// and auxiliary inputs necessary for full verification.
// This proof is serialized and passed around in the JavaScript runtime.
#[derive(CanonicalSerialize, CanonicalDeserialize)]
pub struct FcAnonProf {
    pub proof: SpartanProof<Curve>,
    s_fc: ark_secp256k1::Fr,
    r: ark_secp256k1::Fq,
    is_y_odd: bool,
    msg_hash: BigUint,
}

#[wasm_bindgen]
pub fn prove_membership(
    s_fc: &[u8],
    s: &[u8],
    r: &[u8],
    is_y_odd: bool,
    msg_hash: &[u8],
    merkle_siblings: &[u8],
    merkle_indices: &[u8],
    root: &[u8],
) -> Vec<u8> {
    let (priv_input, eth_membership_pub_input) = build_input(
        s,
        r,
        is_y_odd,
        msg_hash,
        merkle_siblings,
        merkle_indices,
        root,
    );

    let s_fc = ark_secq256k1::Fr::from(BigUint::from_bytes_be(s_fc));
    let s_fc_squared = s_fc * s_fc;
    let mut pub_input = vec![s_fc, s_fc_squared];
    pub_input.extend_from_slice(&eth_membership_pub_input);

    // Generate the proof
    let proof = prove(&pub_input, &priv_input);

    // Convert bytes to appropriate types
    let r = ark_secp256k1::Fq::from(BigUint::from_bytes_be(r));
    let msg_hash = BigUint::from_bytes_be(msg_hash);
    let s_fc = ark_secp256k1::Fr::from(s_fc.into_bigint());

    let membership_proof = FcAnonProf {
        s_fc,
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
    let full_proof = FcAnonProf::deserialize_compressed(full_proof).unwrap();
    let pub_inputs = full_proof.proof.pub_input.clone();

    let tx = pub_inputs[2];
    let ty = pub_inputs[3];
    let ux = pub_inputs[4];
    let uy = pub_inputs[5];

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
    let creddd_proof = FcAnonProf::deserialize_compressed(creddd_proof).unwrap();
    let pub_inputs = creddd_proof.proof.pub_input.clone();
    let root = pub_inputs[6];

    root.into_bigint().to_bytes_be()
}

// Get the  message hash from the proof's public input
#[wasm_bindgen]
pub fn get_msg_hash(creddd_proof: &[u8]) -> Vec<u8> {
    let creddd_proof = FcAnonProf::deserialize_compressed(creddd_proof).unwrap();
    creddd_proof.msg_hash.to_bytes_be()
}

#[cfg(test)]
mod tests {
    use super::*;
    use ark_ff::BigInteger;
    use ark_std::{end_timer, start_timer};
    use eth_membership::utils::test_utils::mock_sig;
    use num_bigint::BigUint;
    use spartan::{
        merkle_tree::{MerkleProof, MerkleTree},
        poseidon::constants::secp256k1_w3,
    };

    type F = ark_secq256k1::Fr;

    #[test]
    fn test_fc_anon() {
        client_prepare();

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

        let merkle_proof: MerkleProof<F> = tree.create_proof(address);

        let s_fc_bytes = ark_secp256k1::Fr::from(333).into_bigint().to_bytes_be();
        let s_bytes = s.into_bigint().to_bytes_be();
        let r_bytes = r.into_bigint().to_bytes_be();
        let msg_hash = msg_hash.to_bytes_be();
        let merkle_siblings = merkle_proof
            .siblings
            .iter()
            .flat_map(|sibling| sibling.into_bigint().to_bytes_be())
            .collect::<Vec<u8>>();

        let merkle_indices = merkle_proof
            .path_indices
            .iter()
            .map(|i| F::from(*i as u32).into_bigint().to_bytes_be())
            .flatten()
            .collect::<Vec<u8>>();

        let root = tree.root.unwrap().into_bigint().to_bytes_be();

        let prover_timer = start_timer!(|| "prove");
        let proof = prove_membership(
            &s_fc_bytes,
            &s_bytes,
            &r_bytes,
            is_y_odd,
            &msg_hash,
            &merkle_siblings,
            &merkle_indices,
            &root,
        );
        end_timer!(prover_timer);

        let verifier_timer = start_timer!(|| "verify");
        assert!(verify_membership(&proof));
        end_timer!(verifier_timer);
    }
}
