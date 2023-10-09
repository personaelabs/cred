// File that runs in a web worker to generate proofs.
// Proof generation takes time, so we run it in a web worker to
// prevent the UI from freezing.

import * as Comlink from 'comlink';
import { MembershipProver, MerkleProof } from '@personaelabs/spartan-ecdsa';
import { toPrefixedHex } from './utils';
import { Hex } from 'viem';

// We use a circuit with a smaller tree than the default circuit.
// The default circuit has 2^20 leaves and the circuit used here has 2^15 leaves.
// We use a smaller circuit to make the merkle tree construction faster.
const prover = new MembershipProver({
  witnessGenWasm:
    'https://storage.googleapis.com/personae-proving-keys/creddd/addr_membership.wasm',
  circuit: 'https://storage.googleapis.com/personae-proving-keys/creddd/addr_membership.circuit',
  enableProfiler: true,
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
