/* tslint:disable */
/* eslint-disable */
/**
*/
export function init_panic_hook(): void;
/**
*/
export function prepare(): void;
/**
* @param {Uint8Array} pub_input
* @param {Uint8Array} priv_input
* @returns {Uint8Array}
*/
export function prove(pub_input: Uint8Array, priv_input: Uint8Array): Uint8Array;
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
* @param {Uint8Array} roots
* @returns {Uint8Array}
*/
export function prove_membership(s: Uint8Array, r: Uint8Array, is_y_odd: boolean, msg_hash: Uint8Array, merkle_siblings: Uint8Array, merkle_indices: Uint8Array, roots: Uint8Array): Uint8Array;
/**
* @param {Uint8Array} creddd_proof
* @returns {boolean}
*/
export function verify_membership(creddd_proof: Uint8Array): boolean;
/**
* @param {Uint8Array} creddd_proof
* @returns {Uint8Array}
*/
export function get_roots(creddd_proof: Uint8Array): Uint8Array;
/**
* @param {Uint8Array} creddd_proof
* @returns {Uint8Array}
*/
export function get_msg_hash(creddd_proof: Uint8Array): Uint8Array;
