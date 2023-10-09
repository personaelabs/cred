import { MerkleProof } from '@personaelabs/spartan-ecdsa';
import { useEffect, useMemo, useState } from 'react';
import { Hex, hashMessage } from 'viem';
import { Prover } from '@/lib/prover';
import * as Comlink from 'comlink';

let worker: Comlink.Remote<typeof Prover>;

export const useProve = () => {
  useEffect(() => {
    // Initialize the web worker
    worker = Comlink.wrap(new Worker(new URL('../lib/prover.ts', import.meta.url)));
    worker.prepare();
  }, []);

  const prove = async (
    sig: string,
    message: string,
    merkleProof: MerkleProof,
  ): Promise<{
    proof: Hex;
    publicInput: Hex;
  }> => {
    if (!worker) {
      throw new Error('Prover not initialized');
    }

    const msgHash = hashMessage(message, 'bytes');
    // Generate the proof in the web worker
    const { proof, publicInput } = await worker.prove(sig, Buffer.from(msgHash), merkleProof);

    return { proof, publicInput };
  };

  return { prove };
};
