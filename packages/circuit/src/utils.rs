use ark_ec::{AffineRepr, CurveGroup};
use ark_ff::{Field, PrimeField};
use ark_secp256k1::Affine;
use ark_secp256k1::Fq;
use ark_secp256k1::Fr;
use num_bigint::BigUint;

pub fn efficient_ecdsa(msg_hash: BigUint, r: Fq, is_y_odd: bool) -> (Affine, Affine) {
    let g = Affine::generator();

    let r_ys = Affine::get_ys_from_x_unchecked(r);
    let r_point = if is_y_odd {
        Affine::new(r, r_ys.unwrap().0)
    } else {
        Affine::new(r, r_ys.unwrap().1)
    };

    let one = BigUint::from(1u32);
    let modulus = BigUint::from(Fr::MODULUS);

    let r_inv_mod_n = Fr::from(BigUint::from(r.into_bigint())).inverse().unwrap();

    // w = r^-1 * msg
    let w = -Fr::from(BigUint::from(msg_hash).modpow(&one, &modulus)) * r_inv_mod_n;
    // u = -(w * G) = -(r^-1 * msg * G)
    let u = (g * w).into_affine();

    // t = r^-1 * R
    let t = (r_point * r_inv_mod_n).into_affine();

    (u, t)
}

pub fn verify_efficient_ecdsa(
    msg_hash: BigUint,
    r: Fq,
    is_y_odd: bool,
    t: Affine,
    u: Affine,
) -> bool {
    let (expected_u, expected_t) = efficient_ecdsa(msg_hash, r, is_y_odd);

    t == expected_t && u == expected_u
}

#[cfg(test)]
pub mod test_utils {
    use super::*;
    use ethers::types::H160;
    use ethers::{
        prelude::*,
        utils::{hash_message, secret_key_to_address},
    };
    use k256::ecdsa::RecoveryId;
    use k256::{ecdsa::SigningKey, elliptic_curve::ScalarPrimitive, SecretKey};

    pub struct EffEcdsaInput {
        pub s: Fr,
        pub u: Affine,
        pub t: Affine,
        pub msg_hash: BigUint,
        pub pub_key: Affine,
        pub address: H160,
    }

    pub fn mock_sig(priv_key: u64) -> (Fr, Fq, bool, BigUint, Affine, H160) {
        let signing_key = SigningKey::from(SecretKey::new(ScalarPrimitive::from(priv_key)));
        let g = Affine::generator();
        let pub_key = (g * Fr::from(priv_key)).into_affine();
        let address = secret_key_to_address(&signing_key);

        let message = b"harry potter";
        let msg_hash = hash_message(message);
        let msg_hash_bigint = BigUint::from_bytes_be(&msg_hash.to_fixed_bytes());
        let wallet = Wallet::from(signing_key);
        let sig = wallet.sign_hash(msg_hash).unwrap();

        let mut s = [0u8; 32];
        let mut r = [0u8; 32];
        sig.s.to_big_endian(&mut s);
        sig.r.to_big_endian(&mut r);

        let is_y_odd = sig.v == 27;

        let s = Fr::from(BigUint::from_bytes_be(&s));
        let r = Fq::from(BigUint::from_bytes_be(&r));

        (s, r, is_y_odd, msg_hash_bigint, pub_key, address)
    }

    pub fn mock_eff_ecdsa_input(priv_key: u64) -> EffEcdsaInput {
        let (s, r, is_y_odd, msg_hash_bigint, pub_key, address) = mock_sig(priv_key);
        let (u, t) = efficient_ecdsa(msg_hash_bigint.clone(), r, is_y_odd);

        EffEcdsaInput {
            s,
            u,
            t,
            msg_hash: msg_hash_bigint,
            pub_key,
            address,
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::utils::test_utils::mock_eff_ecdsa_input;

    use super::*;

    #[test]
    fn test_eff_ecdsa() {
        let mock_eff_ecdsa = mock_eff_ecdsa_input(42);

        // s * T + U = pubkey
        let recovered_pubkey =
            ((mock_eff_ecdsa.t * mock_eff_ecdsa.s).into_affine() + mock_eff_ecdsa.u).into_affine();
        assert_eq!(recovered_pubkey, mock_eff_ecdsa.pub_key);
    }
}
