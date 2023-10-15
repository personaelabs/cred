use ark_ff::{BigInteger, PrimeField};
use ark_secq256k1::Fr;
use num_bigint::BigUint;
use spartan::{
    constraint_system::{ConstraintSystem, Wire},
    frontend::gadgets::{
        ec_add_complete, ec_mul, poseidon::poseidon::PoseidonChip, to_addr, to_le_bits,
        verify_merkle_proof, AffinePoint,
    },
    poseidon::constants::secp256k1_w3,
};

use crate::utils::efficient_ecdsa;

pub const TREE_DEPTH: usize = 15;

pub fn eth_membership<F: PrimeField>(cs: &mut ConstraintSystem<F>) {
    // #############################################
    // Private inputs
    // #############################################

    // `s` part of the signature
    let s_bits = cs.alloc_priv_inputs(256);

    // Merkle proof
    let merkle_indices = cs.alloc_priv_inputs(TREE_DEPTH);
    let merkle_siblings = cs.alloc_priv_inputs(TREE_DEPTH);

    // #############################################
    // Public inputs
    // #############################################

    let t_x = cs.alloc_pub_input();
    let t_y = cs.alloc_pub_input();

    let u_x = cs.alloc_pub_input();
    let u_y = cs.alloc_pub_input();

    // #############################################
    // Constraints
    // #############################################

    // 1. Recover the public key from the signature
    // s_mul_t = s * T
    let t = AffinePoint::new(t_x, t_y);
    let s_mul_t = ec_mul(t, &s_bits, cs);

    // pubKey = sMultT + U
    let u = AffinePoint::new(u_x, u_y);
    let pub_key = ec_add_complete(s_mul_t, u, cs);

    let pub_key_x_bits = to_le_bits(pub_key.x);
    let pub_key_y_bits = to_le_bits(pub_key.y);

    // We need this transformation because the bits should be in little endian
    // and the bytes should be in big endian.
    let pub_key_x_bits_be = pub_key_x_bits
        .chunks(8)
        .map(|byte| byte.to_vec())
        .rev()
        .flat_map(|x| x)
        .collect::<Vec<Wire<F>>>();

    let pub_key_y_bits_be = pub_key_y_bits
        .chunks(8)
        .map(|byte| byte.to_vec())
        .rev()
        .flat_map(|x| x)
        .collect::<Vec<Wire<F>>>();

    let pub_key_bits = [pub_key_x_bits_be, pub_key_y_bits_be].concat();

    // Get the Ethereum address from the public key
    let address = to_addr(pub_key_bits.try_into().unwrap());

    let poseidon_chip = PoseidonChip::new(cs, secp256k1_w3());
    // Verify the Merkle proof
    let root = verify_merkle_proof(
        address,
        &merkle_siblings,
        &merkle_indices,
        poseidon_chip,
        cs,
    );

    cs.expose_public(root);
}

pub fn to_cs_field(x: ark_secp256k1::Fq) -> ark_secq256k1::Fr {
    ark_secq256k1::Fr::from(x.into_bigint())
}

// Build the private and public inputs for the eth_membership circuit
// from the witness inputs in bytes
pub fn build_input(
    s: &[u8],
    r: &[u8],
    is_y_odd: bool,
    msg_hash: &[u8],
    merkle_siblings: &[u8],
    merkle_indices: &[u8],
    root: &[u8],
) -> (Vec<Fr>, Vec<Fr>) {
    // Deserialize the inputs
    let s = ark_secp256k1::Fr::from(BigUint::from_bytes_be(s));
    let r = ark_secp256k1::Fq::from(BigUint::from_bytes_be(r));
    let msg_hash = BigUint::from_bytes_be(msg_hash);
    let merkle_siblings = merkle_siblings
        .to_vec()
        .chunks(32)
        .map(|sibling| Fr::from(BigUint::from_bytes_be(&sibling)))
        .collect::<Vec<Fr>>();
    let merkle_indices = merkle_indices
        .to_vec()
        .chunks(32)
        .map(|index| Fr::from(BigUint::from_bytes_be(&index)))
        .collect::<Vec<Fr>>();
    let root = ark_secq256k1::Fr::from(BigUint::from_bytes_be(root));

    // Compute the efficient ECDSA input
    let (u, t) = efficient_ecdsa(msg_hash.clone(), r, is_y_odd);

    // Construct the private input
    let mut priv_input = vec![];

    let s_bits = s
        .into_bigint()
        .to_bits_le()
        .iter()
        .map(|b| Fr::from(*b))
        .collect::<Vec<Fr>>();

    priv_input.extend_from_slice(&s_bits);
    priv_input.extend_from_slice(&merkle_indices);
    priv_input.extend_from_slice(&merkle_siblings);

    // Construct the public input
    let pub_input = vec![
        to_cs_field(t.x),
        to_cs_field(t.y),
        to_cs_field(u.x),
        to_cs_field(u.y),
        root,
    ];

    (priv_input, pub_input)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::test_utils::mock_witness_input;

    type F = ark_secq256k1::Fr;

    #[test]
    fn test_eth_membership() {
        let synthesizer = |cs: &mut ConstraintSystem<_>| {
            eth_membership(cs);
        };

        let mut cs = ConstraintSystem::<_>::new();
        cs.set_constraints(&synthesizer);

        let mock_witness_input = mock_witness_input::<ark_secq256k1::Fr>();

        let (priv_input, pub_input) = build_input(
            &mock_witness_input.s,
            &mock_witness_input.r,
            mock_witness_input.is_y_odd,
            &mock_witness_input.msg_hash,
            &mock_witness_input.merkle_siblings,
            &mock_witness_input.merkle_indices,
            &mock_witness_input.root,
        );

        let witness: Vec<F> = cs.gen_witness(&synthesizer, &pub_input, &priv_input);

        assert!(cs.is_sat(&witness, &pub_input));
    }
}

pub mod utils;
