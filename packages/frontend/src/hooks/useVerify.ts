import { FullProof } from '@/types';
import { MembershipVerifier, defaultAddressMembershipVConfig } from '@personaelabs/spartan-ecdsa';
import { useEffect, useMemo, useState } from 'react';

export const useVerify = () => {
  const [verifying, setVerifying] = useState<boolean>(false);

  const verifierV1 = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new MembershipVerifier({
        ...defaultAddressMembershipVConfig,
        enableProfiler: true,
        useRemoteCircuit: true,
      });
    }
  }, []);

  const verifierV2 = useMemo(() => {
    if (typeof window !== 'undefined') {
      // In V2, we use a circuit with a smaller tree than the default circuit.
      // The default circuit has 2^20 leaves and the circuit used here has 2^15 leaves.
      // We use a smaller circuit to make the merkle tree construction faster.
      return new MembershipVerifier({
        circuit:
          'https://storage.googleapis.com/personae-proving-keys/creddd/addr_membership.circuit',
        enableProfiler: true,
        useRemoteCircuit: true,
      });
    }
  }, []);

  useEffect(() => {
    // Load the wasm module for both V1 and V2 verifiers
    if (verifierV1) {
      verifierV1.initWasm();
    }

    if (verifierV2) {
      verifierV2.initWasm();
    }
  }, [verifierV1, verifierV2]);

  const verify = async (fullProof: FullProof): Promise<boolean> => {
    setVerifying(true);

    // Serialize the proof and public input
    const proofBytes = Buffer.from(fullProof.proof.replace('0x', ''), 'hex');
    const publicInputBytes = Buffer.from(fullProof.publicInput.replace('0x', ''), 'hex');

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

    setVerifying(false);
    return result;
  };

  return { verify, verifying };
};
