use ark_ec::{AffineRepr, CurveGroup, Group};
use ark_ff::PrimeField;
use num_bigint::{BigInt, BigUint};
use spartan::{
    constraint_system::ConstraintSystem,
    frontend::gadgets::{ec_add_complete, ec_mul, to_addr, to_bits, AffinePoint},
};

const TREE_DEPTH: usize = 12;

pub fn eth_membership<F: PrimeField>(cs: &mut ConstraintSystem<F>) {
    // #############################################
    // Private inputs
    // #############################################

    // `s` part of the signature
    let s_bits = cs.alloc_priv_inputs(256);

    // Merkle proof
    /*
    let merkle_indices = cs.alloc_priv_inputs(TREE_DEPTH);
    let merkle_siblings = cs.alloc_priv_inputs(TREE_DEPTH);
     */

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
    let pub_key_bits = [to_bits(pub_key.x, 256), to_bits(pub_key.y, 256)].concat();

    // Get the Ethereum address from the public key
    let address = to_addr(pub_key_bits.try_into().unwrap());

    // 2. Verify the Merkle proof

    // let root = verify_merkle_proof(address, &merkle_siblings, &merkle_indices, cs);

    cs.expose_public(address);
    /*
    let zero = cs.zero();
    cs.expose_public(zero);
     */
}

#[cfg(test)]
mod tests {
    use ark_ff::{BigInteger, Field};

    use super::*;
    use crate::utils::{bytes_le_to_bits, test_utils::mock_eff_ecdsa_input};

    type F = ark_secq256k1::Fr;

    fn to_cs_field(x: ark_secp256k1::Fq) -> F {
        F::from(x.into_bigint())
    }

    #[test]
    fn test_eth_membership() {
        let synthesizer = |cs: &mut ConstraintSystem<F>| {
            eth_membership(cs);
        };

        let mut cs = ConstraintSystem::<F>::new();
        cs.set_constraints(&synthesizer);

        let eff_ecdsa_input = mock_eff_ecdsa_input(42);
        let priv_input = eff_ecdsa_input
            .s
            .into_bigint()
            .to_bits_le()
            .iter()
            .map(|b| F::from(*b))
            .collect::<Vec<F>>();

        let pub_input = [
            to_cs_field(*eff_ecdsa_input.t.x().unwrap()),
            to_cs_field(*eff_ecdsa_input.t.y().unwrap()),
            to_cs_field(*eff_ecdsa_input.u.x().unwrap()),
            to_cs_field(*eff_ecdsa_input.u.y().unwrap()),
            F::from(BigUint::from_bytes_be(
                &eff_ecdsa_input.address.to_fixed_bytes(),
            )),
        ];

        let witness: Vec<F> = cs.gen_witness(&synthesizer, &pub_input, &priv_input);

        let mut num_zeros = 0;
        let mut num_ones = 0;
        for w_i in witness.iter() {
            if *w_i == F::ZERO {
                num_zeros += 1;
            } else if *w_i == F::ONE {
                num_ones += 1;
            }
        }

        println!("witness size: {}", witness.len());
        println!("num_zeros: {}", num_zeros);
        println!("num_ones: {}", num_ones);

        //  assert!(cs.is_sat(&witness, &pub_input));
    }
}
