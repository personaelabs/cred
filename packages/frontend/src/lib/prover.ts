// File that runs in a web worker to generate proofs.
// Proof generation takes time, so we run it in a web worker to
// prevent the UI from freezing.

import * as Comlink from 'comlink';
import {
  MembershipProver,
  MerkleProof,
  defaultAddressMembershipPConfig,
} from '@personaelabs/spartan-ecdsa';
import { toPrefixedHex } from './utils';
import { Hex } from 'viem';

const prover = new MembershipProver({
  ...defaultAddressMembershipPConfig,
  useRemoteCircuit: true,
});

export const Prover = {
  async prepare() {
    // Load the prover wasm file
    await prover.initWasm();
  },

  // Generate prove and return the proof and public input
  // as hex strings
  async prove(
    sig: string,
    msgHash: Buffer,
    merkleProof: MerkleProof,
  ): Promise<{
    proof: Hex;
    publicInput: Hex;
  }> {
    console.log('Proving...');
    const fullProof = await prover.prove(sig, msgHash, merkleProof);

    // Convert the proof and the public input to hex format
    const proof = toPrefixedHex(Buffer.from(fullProof.proof).toString('hex'));
    const publicInput = toPrefixedHex(
      Buffer.from(fullProof.publicInput.serialize()).toString('hex'),
    );

    return { proof, publicInput };
  },
};

Comlink.expose(Prover);
