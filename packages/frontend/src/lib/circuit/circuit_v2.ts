import { MembershipVerifier } from '@personaelabs/spartan-ecdsa';

let verifier: MembershipVerifier;

export const prepare = () => {
  // In V2, we use a circuit with a smaller tree than the default circuit.
  // The default circuit has 2^20 leaves and the circuit used here has 2^15 leaves.
  // We use a smaller circuit to make the merkle tree construction faster.
  verifier = new MembershipVerifier({
    circuit: 'https://storage.googleapis.com/personae-proving-keys/creddd/addr_membership.circuit',
    enableProfiler: true,
    useRemoteCircuit: true,
  });

  // Initialize the wasm module
  verifier.initWasm();
};

export const verify = async (proof: Uint8Array, publicInput: Uint8Array): Promise<boolean> => {
  // Initialize the wasm module if not yet initialized
  await verifier.initWasm();

  // Verify the proof
  return await verifier.verify(proof, publicInput);
};
