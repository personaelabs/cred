mod eth_membership;
mod utils;

use crate::utils::{efficient_ecdsa, verify_efficient_ecdsa};
use ark_ff::BigInteger;
use ark_secp256k1::{Affine, Fq, Fr};
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};
use eth_membership::{eth_membership, to_cs_field};
use num_bigint::BigUint;
use spartan::constraint_system::ConstraintSystem;
use spartan::{circuit, wasm::wasm_deps::*};

type Curve = spartan::ark_secq256k1::Projective;
type F = ark_secq256k1::Fr;

circuit!(|cs: &mut ConstraintSystem<F>| { eth_membership(cs) }, Curve);

#[derive(CanonicalSerialize, CanonicalDeserialize)]
pub struct MembershipProof {
    pub proof: SpartanProof<Curve>,
    r: Fq,
    is_y_odd: bool,
    msg_hash: BigUint,
}

// Get the Merkle root from the proof's publici nput
#[wasm_bindgen]
pub fn get_root(creddd_proof: &[u8]) -> Vec<u8> {
    let creddd_proof = MembershipProof::deserialize_compressed(creddd_proof).unwrap();
    let pub_inputs = creddd_proof.proof.pub_input.clone();
    let root = pub_inputs[4];

    root.into_bigint().to_bytes_be()
}

// Get the Merkle root from the proof's public input
#[wasm_bindgen]
pub fn get_msg_hash(creddd_proof: &[u8]) -> Vec<u8> {
    let creddd_proof = MembershipProof::deserialize_compressed(creddd_proof).unwrap();
    creddd_proof.msg_hash.to_bytes_be()
}

#[wasm_bindgen]
pub fn verify_membership(creddd_proof: &[u8]) -> bool {
    let creddd_proof = MembershipProof::deserialize_compressed(creddd_proof).unwrap();
    let pub_inputs = creddd_proof.proof.pub_input.clone();

    // Verify that the public inputs are valid

    let tx = pub_inputs[0];
    let ty = pub_inputs[1];
    let ux = pub_inputs[2];
    let uy = pub_inputs[3];

    let t = Affine::new(tx, ty);
    let u = Affine::new(ux, uy);

    let r = creddd_proof.r;
    let is_y_odd = creddd_proof.is_y_odd;
    let msg_hash = creddd_proof.msg_hash;

    let is_proof_valid = verify(creddd_proof.proof);

    let is_efficient_ecdsa_valid = verify_efficient_ecdsa(msg_hash, r, is_y_odd, t, u);

    is_proof_valid && is_efficient_ecdsa_valid
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

    let root = F::from(BigUint::from_bytes_be(root));

    let (u, t) = efficient_ecdsa(msg_hash.clone(), r, is_y_odd);

    let mut priv_input = vec![];

    let s_bits = s
        .into_bigint()
        .to_bits_le()
        .iter()
        .map(|b| F::from(*b))
        .collect::<Vec<F>>();

    priv_input.extend_from_slice(&s_bits);
    priv_input.extend_from_slice(&merkle_indices);
    priv_input.extend_from_slice(&merkle_siblings);

    let pub_input = [
        to_cs_field(t.x),
        to_cs_field(t.y),
        to_cs_field(u.x),
        to_cs_field(u.y),
        root,
    ];

    let proof = prove(&pub_input, &priv_input);

    let membership_proof = MembershipProof {
        proof,
        r,
        is_y_odd,
        msg_hash,
    };

    let mut membership_proof_bytes = Vec::new();
    membership_proof
        .serialize_compressed(&mut membership_proof_bytes)
        .unwrap();

    membership_proof_bytes
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::test_utils::mock_sig;
    use ark_ff::BigInteger;
    use ark_std::{end_timer, start_timer};
    use num_bigint::BigUint;
    use spartan::{
        merkle_tree::{MerkleProof, MerkleTree},
        poseidon::constants::secp256k1_w3,
    };

    #[test]
    fn bench_eth_membership() {
        client_prepare();

        const TREE_DEPTH: usize = 20;

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
