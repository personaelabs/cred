import * as Comlink from 'comlink';
import { useEffect, useState } from 'react';
import { VerifyRequestBody, WitnessInput } from '@/app/types';
import { useAccount, useSignMessage } from 'wagmi';
import { MerkleTreeSelect } from '@/app/api/groups/[group]/merkle-proofs/route';
import {
  calculateSigRecovery,
  concatUint8Arrays,
  fromHexString,
  toHexString,
} from '@/lib/utils';
import { Hex, hashMessage, hexToBytes, hexToSignature, keccak256 } from 'viem';
import { toast } from 'sonner';
import * as Sentry from '@sentry/nextjs';

interface Prover {
  prepare(): Promise<void>;
  prove(witness: WitnessInput): Promise<Uint8Array>;
}

const getMerkleTree = async (
  groupHandle: string
): Promise<MerkleTreeSelect> => {
  const res = await fetch(`/api/groups/${groupHandle}/merkle-proofs`);
  const tree = (await res.json()) as MerkleTreeSelect;
  return tree;
};

const SIG_SALT = Buffer.from('0xdd01e93b61b644c842a5ce8dbf07437f', 'hex');

let prover: Comlink.Remote<Prover>;
const useProver = () => {
  const { address } = useAccount();

  const fcAccountPubKey = ''; // TODO: get the user's Farcaster account public key

  const message = `\n${SIG_SALT}Personae attest:${fcAccountPubKey}`;
  const { signMessageAsync } = useSignMessage({
    message,
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    prover = Comlink.wrap<Prover>(
      new Worker(new URL('../lib/prover.ts', import.meta.url))
    );
    prover.prepare();
  }, []);

  const prove = async (
    groupHandle: string
  ): Promise<VerifyRequestBody | null> => {
    if (prover && address && fcAccountPubKey) {
      await prover.prepare();

      // Sign message with the source key
      const sig = await signMessageAsync();

      toast('Adding creddd...', {
        description: 'This may take few minutes...',
      });

      const merkleTree = await getMerkleTree(groupHandle);

      const sourcePubKeySigHash = keccak256(sig);

      const { s, r, v } = hexToSignature(sig);
      const isYOdd = calculateSigRecovery(v);

      const msgHash = hashMessage(message);

      const merkleProof = merkleTree.merkleProofs.find(
        proof => proof.address === address.toLowerCase()
      );

      if (!merkleProof) {
        throw new Error('Merkle proof not found');
      }

      // Construct the witness
      const witness: WitnessInput = {
        s: hexToBytes(s),
        r: hexToBytes(r),
        isYOdd,
        msgHash: hexToBytes(msgHash),
        siblings: concatUint8Arrays(
          merkleProof.path.map(path => fromHexString(path as Hex, 32))
        ),
        indices: concatUint8Arrays(
          merkleProof.pathIndices.map(index => {
            const buf = new Uint8Array(32);
            if (index === 1) {
              buf[31] = 1;
            }
            return buf;
          })
        ),
        root: hexToBytes(merkleTree.merkleRoot as Hex),
      };

      const proof = await prover.prove(witness).catch(err => {
        setFailed(true);
        Sentry.captureException(err);
      });

      if (proof) {
        return {
          proof: toHexString(proof),
          sourcePubKeySigHash,
        };
      }

      return null;
    } else {
      throw new Error('Not ready to prove');
    }
  };

  return { prove, failed };
};

export default useProver;
