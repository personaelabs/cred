'use client';

import * as Comlink from 'comlink';
import { useEffect } from 'react';
import { FidAttestationRequestBody, WitnessInput } from '@/app/types';
import { WalletClient } from 'wagmi';
import { MerkleTreeSelect } from '@/app/api/groups/[group]/merkle-proofs/route';
import {
  calculateSigRecovery,
  concatUint8Arrays,
  fromHexString,
  toHexString,
} from '@/lib/utils';
import {
  Hex,
  hashMessage,
  hexToBytes,
  hexToCompactSignature,
  hexToSignature,
} from 'viem';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';

interface Prover {
  prepare(): Promise<void>;
  prove(_witness: WitnessInput): Promise<Uint8Array>;
}

const getMerkleTree = async (groupId: number): Promise<MerkleTreeSelect> => {
  const res = await fetch(`/api/groups/${groupId}/merkle-proofs`);
  const tree = (await res.json()) as MerkleTreeSelect;
  return tree;
};

const SIG_SALT = Buffer.from('0xdd01e93b61b644c842a5ce8dbf07437f', 'hex');

let prover: Comlink.Remote<Prover>;
const useProver = () => {
  const { user, siwfResponse } = useUser();

  useEffect(() => {
    prover = Comlink.wrap<Prover>(
      new Worker(new URL('../lib/prover.ts', import.meta.url))
    );
  }, []);

  const prove = async (
    address: Hex,
    client: WalletClient,
    groupId: number
  ): Promise<FidAttestationRequestBody | null> => {
    if (prover && user?.fid && siwfResponse) {
      const message = `\n${SIG_SALT}Personae attest:${user?.fid}`;

      await prover.prepare();

      // Sign message with the source key
      const sig = await client.signMessage({
        message,
      });

      toast('Adding creddd...', {
        description: 'This may take a minute...',
      });

      const merkleTree = await getMerkleTree(groupId);

      const { s, r, v } = hexToSignature(sig);
      const isYOdd = calculateSigRecovery(v);

      const msgHash = hashMessage(message);

      const merkleProof = merkleTree.merkleProofs.find(
        proof => proof.address === address.toLowerCase()
      );

      if (!merkleProof) {
        throw new Error('Merkle proof not found');
      }

      if (!siwfResponse.signature) {
        throw new Error('SIWF response signature not found');
      }

      const { yParityAndS: signInSigS } = hexToCompactSignature(
        siwfResponse.signature
      );

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
        signInSigS: hexToBytes(signInSigS),
      };

      const proof = await prover.prove(witness);

      if (proof) {
        // Extract the `issuedAt` from the SIWF message
        const issuedAt = siwfResponse.message?.match(
          /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/
        );

        if (!issuedAt || issuedAt.length === 0) {
          throw new Error('Could not extract `issuedAt` from SIWF message');
        }

        return {
          proof: toHexString(proof),
          signInSig: siwfResponse.signature,
          custody: siwfResponse.custody!,
          signInSigNonce: siwfResponse.nonce,
          fid: user.fid,
          treeId: merkleTree.id,
          issuedAt: issuedAt[0],
        };
      }

      /*
      console.log(siwfResponse.message);
      return {
        proof: '0x0',
        signInSigS: siwfResponse.signature!,
        custody: siwfResponse.custody!,
        signInSigNonce: siwfResponse.nonce,
        fid: user.fid,
        treeId: 0,
        //        issuedAt: buildSignInMessage(siwfResponse.message)
      };
      */

      return null;
    } else {
      console.error('Not ready to prove');
    }

    return null;
  };

  return { prove };
};

export default useProver;
