// File that runs in a web worker to generate proofs.
// Proof generation takes time, so we run it in a web worker to
// prevent the UI from freezing.

import * as Comlink from 'comlink';
import { MembershipVerifier, defaultAddressMembershipVConfig } from '@personaelabs/spartan-ecdsa';
import { FullProof } from '@/types';

const verifierV1 = new MembershipVerifier({
  ...defaultAddressMembershipVConfig,
  enableProfiler: true,
  useRemoteCircuit: true,
});

// In V2, we use a circuit with a smaller tree than the default circuit.
// The default circuit has 2^20 leaves and the circuit used here has 2^15 leaves.
// We use a smaller circuit to make the merkle tree construction faster.
const verifierV2 = new MembershipVerifier({
  circuit: 'https://storage.googleapis.com/personae-proving-keys/creddd/addr_membership.circuit',
  enableProfiler: true,
  useRemoteCircuit: true,
});

export const Verifier = {
  async prepare() {
    // Load the verifier wasm file
    await verifierV1.initWasm();
    await verifierV2.initWasm();
  },

  // Generate prove and return the proof and public input
  // as hex strings
  async verify(fullProof: FullProof): Promise<boolean> {
    const proofBytes = Buffer.from(fullProof.proof.replace('0x', ''), 'hex');
    const publicInputBytes = Buffer.from(fullProof.publicInput.replace('0x', ''), 'hex');
    console.log('verifying');

    let result;
    if (fullProof.proofVersion === 'v1') {
      // Use the V1 verifier to verify the proof
      if (!verifierV1) {
        throw new Error('Verifier not initialized');
      }

      // Initialize the wasm module if not yet initialized
      await verifierV1.initWasm();

      // Verify the proof
      result = await verifierV1.verify(proofBytes, publicInputBytes);
    } else if (fullProof.proofVersion === 'v2') {
      // Use the V2 verifier to verify the proof
      if (!verifierV2) {
        throw new Error('Verifier not initialized');
      }

      // Initialize the wasm module if not yet initialized
      await verifierV2.initWasm();

      // Verify the proof
      result = await verifierV2.verify(proofBytes, publicInputBytes);
    } else {
      throw new Error(`Unknown proof version ${fullProof.proofVersion}`);
    }

    return result;
  },
};

Comlink.expose(Verifier);
