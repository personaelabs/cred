import { FullProof } from '@/types';
import { MembershipVerifier, defaultAddressMembershipVConfig } from '@personaelabs/spartan-ecdsa';
import { useEffect, useMemo, useState } from 'react';

export const useVerify = () => {
  const [verifying, setVerifying] = useState<boolean>(false);

  const verifier = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new MembershipVerifier(defaultAddressMembershipVConfig);
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
    return await verifier.verify(proofBytes, publicInputBytes);
  };

  return { verify, verifying };
};
