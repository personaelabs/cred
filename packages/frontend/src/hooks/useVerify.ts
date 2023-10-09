import { FullProof } from '@/types';
import { MembershipVerifier } from '@personaelabs/spartan-ecdsa';
import { useEffect, useMemo, useState } from 'react';

export const useVerify = () => {
  const [verifying, setVerifying] = useState<boolean>(false);

  const verifier = useMemo(() => {
    if (typeof window !== 'undefined') {
      // We use a circuit with a smaller tree than the default circuit.
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
    if (verifier) {
      verifier.initWasm();
    }
  }, [verifier]);

  const verify = async (fullProof: FullProof): Promise<boolean> => {
    if (!verifier) {
      throw new Error('Verifier not initialized');
    }

    setVerifying(true);
    await verifier.initWasm();

    const proofBytes = Buffer.from(fullProof.proof.replace('0x', ''), 'hex');
    const publicInputBytes = Buffer.from(fullProof.publicInput.replace('0x', ''), 'hex');
    const result = await verifier.verify(proofBytes, publicInputBytes);

    setVerifying(false);
    return result;
  };

  return { verify, verifying };
};
