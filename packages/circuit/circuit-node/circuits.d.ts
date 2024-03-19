/* tslint:disable */
/* eslint-disable */
/**
 */
export function prepare(): void;
/**
 * @param {Uint8Array} pub_input
 * @param {Uint8Array} priv_input
 * @returns {Uint8Array}
 */
export function prove(
  pub_input: Uint8Array,
  priv_input: Uint8Array
): Uint8Array;
/**
 * @param {Uint8Array} proof_ser
 * @returns {boolean}
 */
export function verify(proof_ser: Uint8Array): boolean;
/**
 * @param {Uint8Array} s
 * @param {Uint8Array} r
 * @param {boolean} is_y_odd
 * @param {Uint8Array} msg_hash
 * @param {Uint8Array} merkle_siblings
 * @param {Uint8Array} merkle_indices
 * @param {Uint8Array} root
 * @param {Uint8Array} sign_in_sig
 * @returns {Uint8Array}
 */
export function prove_membership(
  s: Uint8Array,
  r: Uint8Array,
  is_y_odd: boolean,
  msg_hash: Uint8Array,
  merkle_siblings: Uint8Array,
  merkle_indices: Uint8Array,
  root: Uint8Array,
  sign_in_sig: Uint8Array
): Uint8Array;
/**
 * @param {Uint8Array} creddd_proof
 * @returns {boolean}
 */
export function verify_membership(creddd_proof: Uint8Array): boolean;
/**
 * @param {Uint8Array} creddd_proof
 * @returns {Uint8Array}
 */
export function get_merkle_root(creddd_proof: Uint8Array): Uint8Array;
/**
 * @param {Uint8Array} creddd_proof
 * @returns {Uint8Array}
 */
export function get_msg_hash(creddd_proof: Uint8Array): Uint8Array;
/**
 * @param {Uint8Array} creddd_proof
 * @returns {Uint8Array}
 */
export function get_sign_in_sig(creddd_proof: Uint8Array): Uint8Array;
/**
 * @param {Uint8Array} bytes
 * @param {bigint} bitmap_bits
 * @param {number} k_num
 * @param {Uint8Array} sip_keys_bytes
 * @param {Uint8Array} item
 * @returns {boolean}
 */
export function bloom_check(
  bytes: Uint8Array,
  bitmap_bits: bigint,
  k_num: number,
  sip_keys_bytes: Uint8Array,
  item: Uint8Array
): boolean;
/**
 */
export function init_panic_hook(): void;
/**
 * @param {Uint8Array} leaf_bytes
 * @param {number} depth
 * @returns {string}
 */
export function secp256k1_init_tree(
  leaf_bytes: Uint8Array,
  depth: number
): string;
/**
 * @param {Uint8Array} leaf_bytes
 * @returns {string}
 */
export function secp256k1_create_proof(leaf_bytes: Uint8Array): string;
/**
 * @param {Uint8Array} leaf_bytes
 * @param {number} depth
 * @returns {(string)[]}
 */
export function secp256k1_get_proofs(
  leaf_bytes: Uint8Array,
  depth: number
): string[];
