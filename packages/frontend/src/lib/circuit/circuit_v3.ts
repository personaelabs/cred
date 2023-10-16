import { WitnessInput } from '@/types';
import { Hex, bytesToHex, hexToBytes } from 'viem';

let wasmPkg: any;
export const CircuitV3 = {
  async prepare() {
    // V3 verifier
    // We need to import the wasm package in run-time because
    // it only runs in browser environment.
    // @ts-ignore
    wasmPkg = await import('circuit-web');
    // @ts-ignore
    wasmPkg.init_panic_hook();

    wasmPkg.client_prepare();
  },

  async prove(input: WitnessInput): Promise<Uint8Array> {
    const proof = await wasmPkg.prove_membership(
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
    const proofBytes = hexToBytes(proof);
    return await wasmPkg.verify_membership(proofBytes);
  },

  // Get the merkle root from the proof's public input
  getMerkleRoot(proof: Hex): Hex {
    const proofBytes = hexToBytes(proof);
    const result = wasmPkg.get_root(proofBytes);
    return bytesToHex(result);
  },

  // Get the message hash from the proof's public input
  getMsgHash(proof: Hex): Hex {
    const proofBytes = hexToBytes(proof);
    const result = wasmPkg.get_msg_hash(proofBytes);
    return bytesToHex(result);
  },
};

export const WrapperCircuit = CircuitV3;
