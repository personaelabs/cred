import { MembershipVerifier, defaultAddressMembershipVConfig } from '@personaelabs/spartan-ecdsa';

let verifier: MembershipVerifier;

export const prepare = () => {
  verifier = new MembershipVerifier({
    ...defaultAddressMembershipVConfig,
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
