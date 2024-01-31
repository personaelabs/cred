import * as Comlink from 'comlink';
import { useEffect, useState } from 'react';
import { VerifyRequestBody, WitnessInput } from '@/app/types';
import useSigner from './useSigner';
import { useAccount, useSignMessage } from 'wagmi';
import { MerkleTreeSelect } from '@/app/api/groups/[group]/merkle-proofs/route';
import {
  SIG_SALT,
  calculateSigRecovery,
  concatUint8Arrays,
  fromHexString,
  toHexString,
} from '@/lib/utils';
import { Hex, hashMessage, hexToBytes, hexToSignature, keccak256 } from 'viem';
import { toast } from 'sonner';
import * as Sentry from '@sentry/nextjs';
import { useUserAccount } from '@/contexts/UserAccountContext';

interface Prover {
  prepare(): Promise<void>;
  prove(witness: WitnessInput): Promise<Uint8Array>;
}

// Get the latest merkle tree for a group from the backend.
const getMerkleTree = async (group: string): Promise<MerkleTreeSelect> => {
  const res = await fetch(`/api/groups/${group}/merkle-proofs`);
  const tree = (await res.json()) as MerkleTreeSelect;
  return tree;
};

let prover: Comlink.Remote<Prover>;

const useProver = ({ group }: { group: string }) => {
  const { address } = useAccount();
  const { sign } = useSigner();
  const { pubKey } = useUserAccount();
  const { signMessageAsync } = useSignMessage({
    message: `\n${SIG_SALT}Personae attest:${pubKey}`,
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    prover = Comlink.wrap<Prover>(
      new Worker(new URL('../lib/prover.ts', import.meta.url))
    );
    prover.prepare();
  }, []);

  const prove = async (): Promise<VerifyRequestBody | null> => {
    if (prover && address && pubKey) {
      // await prover.prepare();
      const message = `\n${SIG_SALT}Personae attest:${pubKey}`;

      // Sign message with the source key
      const sig = await signMessageAsync();

      toast('Checking eligibility', {
        description: 'This may take few minutes...',
      });

      const merkleTree = await getMerkleTree(group);

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
        const proofHash = keccak256(proof);

        // Sign message with the target key
        const targetPubKeySig = await sign(
          Buffer.from(`${SIG_SALT}Personae attest:${proofHash}`, 'utf-8')
        );

        return {
          proof: toHexString(proof),
          targetPubKey: pubKey,
          targetPubKeySig: toHexString(targetPubKeySig),
          sourcePubKeySigHash,
        };
      }

      return null;
    } else {
      console.log({
        address,
        pubKey,
      });
      throw new Error('Not ready to prove');
    }
  };

  return { prove, failed };
};

export default useProver;
