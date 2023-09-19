import {
  MembershipProver,
  MerkleProof,
  defaultPubkeyMembershipPConfig,
} from '@personaelabs/spartan-ecdsa';
import { useEffect, useMemo, useState } from 'react';
import { Hex, hashMessage } from 'viem';

export const useProve = () => {
  const [proving, setProving] = useState<boolean>(false);
  const prover = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new MembershipProver(defaultPubkeyMembershipPConfig);
    }
  }, []);

  useEffect(() => {
    if (prover) {
      prover.initWasm();
    }
  }, [prover]);

  const prove = async (sig: string, message: string, merkleProof: MerkleProof): Promise<Hex> => {
    setProving(true);

    if (!prover) {
      throw new Error('Prover not initialized');
    }

    await prover.initWasm();
    const msgHash = Buffer.from(hashMessage(message).replace('0x', ''), 'hex');
    const proof = await prover.prove(sig, msgHash, merkleProof);

    // Concatinate the proof and the public input as bytes
    // @ts-ignore
    const proofBytes = Buffer.concat([proof.proof, proof.publicInput.serialize()]);

    // Convert the proof to hex
    const proofHex: Hex = `0x${proofBytes.toString('hex')}`;
    setProving(false);

    return proofHex;
  };

  return { prove, proving };
};
