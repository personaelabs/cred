// File that runs in a web worker to generate proofs.
// Proof generation takes time, so we run it in a web worker to
// prevent the UI from freezing.

import * as Comlink from 'comlink';
import { MembershipVerifier } from '@personaelabs/spartan-ecdsa';
import { FullProof } from '@/types';

// We use a circuit with a smaller tree than the default circuit.
// The default circuit has 2^20 leaves and the circuit used here has 2^15 leaves.
// We use a smaller circuit to make the merkle tree construction faster.
const verifier = new MembershipVerifier({
  circuit: 'https://storage.googleapis.com/personae-proving-keys/creddd/addr_membership.circuit',
  enableProfiler: true,
  useRemoteCircuit: true,
});

export const Verifier = {
  async prepare() {
    // Load the verifier wasm file
    await verifier.initWasm();
  },

  // Generate prove and return the proof and public input
  // as hex strings
  async verify(fullProof: FullProof): Promise<boolean> {
    const proofBytes = Buffer.from(fullProof.proof.replace('0x', ''), 'hex');
    const publicInputBytes = Buffer.from(fullProof.publicInput.replace('0x', ''), 'hex');
    console.log('verifying');
    return await verifier.verify(proofBytes, publicInputBytes);
  },
};

Comlink.expose(Verifier);
