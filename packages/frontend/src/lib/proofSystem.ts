// File that runs in a web worker to generate proofs.
// Proof generation takes time, so we run it in a web worker to
// prevent the UI from freezing.

import { WitnessInput } from '@/types';
import { Hex, bytesToHex, hexToBytes } from 'viem';

let wasmPkg: any;

export const ProofSystem = {
  async prepare() {
    // We need to import the wasm package in run-time because
    // it only runs in browser environment.
    // @ts-ignore
    wasmPkg = await import('circuits');
    // @ts-ignore
    wasmPkg.init_panic_hook();

    wasmPkg.client_prepare();
  },

  async prove(input: WitnessInput): Promise<Uint8Array> {
    console.log('Proving');
    const proof = wasmPkg.prove_membership(
      input.s,
      input.r,
      input.isYOdd,
      input.msgHash,
      input.siblings,
      input.indices,
      input.root,
    );

    return proof;
  },

  async verify(proof: Hex): Promise<boolean> {
    console.log('Verifying');
    const proofBytes = hexToBytes(proof);
    const result = wasmPkg.verify_membership(proofBytes);
    return result;
  },

  getMerkleRoot(proof: Hex): Hex {
    console.log('Getting merkle root');
    const proofBytes = hexToBytes(proof);
    const result = wasmPkg.get_root(proofBytes);
    return bytesToHex(result);
  },

  getMsgHash(proof: Hex): Hex {
    console.log('Getting msg hash');
    const proofBytes = hexToBytes(proof);
    const result = wasmPkg.get_msg_hash(proofBytes);
    return bytesToHex(result);
  },
};

const WrappedProofSystem = ProofSystem;
