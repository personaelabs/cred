import {
  MembershipProver,
  MerkleProof,
  NIZK,
  defaultAddressMembershipPConfig,
} from '@personaelabs/spartan-ecdsa';
import { useEffect, useMemo, useState } from 'react';
import { hashMessage } from 'viem';

export const useProve = () => {
  const [proving, setProving] = useState<boolean>(false);
  const prover = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new MembershipProver(defaultAddressMembershipPConfig);
    }
  }, []);

  useEffect(() => {
    if (prover) {
      prover.initWasm();
    }
  }, [prover]);

  const prove = async (sig: string, message: string, merkleProof: MerkleProof): Promise<NIZK> => {
    setProving(true);

    if (!prover) {
      throw new Error('Prover not initialized');
    }

    await prover.initWasm();
    const msgHash = Buffer.from(hashMessage(message).replace('0x', ''), 'hex');
    const proof = await prover.prove(sig, msgHash, merkleProof);
    setProving(false);

    return proof;
  };

  return { prove, proving };
};
