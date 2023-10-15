use ark_ec::{AffineRepr, CurveGroup};
use ark_ff::{Field, PrimeField};
use ark_secp256k1::Affine;
use num_bigint::BigUint;

// Compute `T` and `U` for efficient ECDSA verification
pub fn efficient_ecdsa(
    msg_hash: BigUint,
    r: ark_secp256k1::Fq,
    is_y_odd: bool,
) -> (Affine, Affine) {
    let g = Affine::generator();

    // Recover the `R` point
    let r_ys = Affine::get_ys_from_x_unchecked(r);
    let r_point = if is_y_odd {
        Affine::new(r, r_ys.unwrap().0)
    } else {
        Affine::new(r, r_ys.unwrap().1)
    };

    let one = BigUint::from(1u32);
    let modulus = BigUint::from(ark_secp256k1::Fr::MODULUS);

    let r_inv_mod_n = ark_secp256k1::Fr::from(BigUint::from(r.into_bigint()))
        .inverse()
        .unwrap();

    // w = r^-1 * msg
    let w = -ark_secp256k1::Fr::from(BigUint::from(msg_hash).modpow(&one, &modulus)) * r_inv_mod_n;
    // u = -(w * G) = -(r^-1 * msg * G)
    let u = (g * w).into_affine();

    // t = r^-1 * R
    let t = (r_point * r_inv_mod_n).into_affine();

    (u, t)
}

// Verify that `T` and `U` are computed correctly
pub fn verify_efficient_ecdsa(
    msg_hash: BigUint,
    r: ark_secp256k1::Fq,
    is_y_odd: bool,
    t: Affine,
    u: Affine,
) -> bool {
    let (expected_u, expected_t) = efficient_ecdsa(msg_hash, r, is_y_odd);

    t == expected_t && u == expected_u
}

pub mod test_utils {
    use super::*;
    use crate::TREE_DEPTH;
    use ark_ff::BigInteger;
    use ethers::types::H160;
    use ethers::{
        prelude::*,
        utils::{hash_message, secret_key_to_address},
    };
    use k256::{ecdsa::SigningKey, elliptic_curve::ScalarPrimitive, SecretKey};
    use spartan::merkle_tree::{MerkleProof, MerkleTree};
    use spartan::poseidon::constants::secp256k1_w3;

    pub struct MockEffEcdsaInput {
        pub s: ark_secp256k1::Fr,
        pub u: Affine,
        pub t: Affine,
        pub msg_hash: BigUint,
        pub pub_key: Affine,
        pub address: H160,
    }

    pub struct MockWitnessInput {
        pub s: Vec<u8>,
        pub r: Vec<u8>,
        pub is_y_odd: bool,
        pub msg_hash: Vec<u8>,
        pub merkle_siblings: Vec<u8>,
        pub merkle_indices: Vec<u8>,
        pub root: Vec<u8>,
    }

    pub fn mock_sig(
        priv_key: u64,
    ) -> (
        ark_secp256k1::Fr,
        ark_secp256k1::Fq,
        bool,
        BigUint,
        Affine,
        H160,
    ) {
        let signing_key = SigningKey::from(SecretKey::new(ScalarPrimitive::from(priv_key)));
        let g = Affine::generator();
        let pub_key = (g * ark_secp256k1::Fr::from(priv_key)).into_affine();
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

        let s = ark_secp256k1::Fr::from(BigUint::from_bytes_be(&s));
        let r = ark_secp256k1::Fq::from(BigUint::from_bytes_be(&r));

        (s, r, is_y_odd, msg_hash_bigint, pub_key, address)
    }

    pub fn mock_eff_ecdsa_input(priv_key: u64) -> MockEffEcdsaInput {
        let (s, r, is_y_odd, msg_hash_bigint, pub_key, address) = mock_sig(priv_key);
        let (u, t) = efficient_ecdsa(msg_hash_bigint.clone(), r, is_y_odd);

        MockEffEcdsaInput {
            s,
            u,
            t,
            msg_hash: msg_hash_bigint,
            pub_key,
            address,
        }
    }

    pub fn mock_witness_input<F: PrimeField>() -> MockWitnessInput {
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
        let msg_hash_bytes = msg_hash.to_bytes_be();
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

        MockWitnessInput {
            s: s_bytes,
            r: r_bytes,
            is_y_odd,
            msg_hash: msg_hash_bytes,
            merkle_siblings,
            merkle_indices,
            root,
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
