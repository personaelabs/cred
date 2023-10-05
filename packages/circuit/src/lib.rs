mod eth_membership;
mod utils;

use eth_membership::eth_membership;
use spartan::constraint_system::ConstraintSystem;
use spartan::mock_circuit;
use spartan::{circuit, wasm::wasm_deps::*};

type Curve = spartan::ark_secq256k1::Projective;
type F = ark_secq256k1::Fr;

/*
const NUM_CONS: usize = 2usize.pow(4);
circuit!(mock_circuit(NUM_CONS), Curve);
 */

circuit!(|cs: &mut ConstraintSystem<F>| { eth_membership(cs) }, Curve);

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::test_utils::mock_eff_ecdsa_input;
    use ark_ec::AffineRepr;
    use ark_ff::BigInteger;
    use ark_std::{end_timer, start_timer};
    use num_bigint::BigUint;

    #[test]
    fn bench_eth_membership() {
        client_prepare();

        let priv_key = 42;
        let eff_ecdsa_input = mock_eff_ecdsa_input(priv_key);

        let priv_input = eff_ecdsa_input
            .s
            .into_bigint()
            .to_bits_le()
            .iter()
            .map(|b| F::from(*b))
            .collect::<Vec<F>>();

        println!("addr: {:?}", eff_ecdsa_input.address);

        let pub_input = [
            F::from(eff_ecdsa_input.t.x().unwrap().into_bigint()),
            F::from(eff_ecdsa_input.t.y().unwrap().into_bigint()),
            F::from(eff_ecdsa_input.u.x().unwrap().into_bigint()),
            F::from(eff_ecdsa_input.u.y().unwrap().into_bigint()),
            F::from(BigUint::from_bytes_be(
                &eff_ecdsa_input.address.to_fixed_bytes(),
            )),
        ];

        let prover_timer = start_timer!(|| "prove");
        let proof = prove(&pub_input, &priv_input);
        end_timer!(prover_timer);
    }
}
