'use client';

import * as Comlink from 'comlink';
import { useEffect } from 'react';
import {
  EligibleGroup,
  FidAttestationRequestBody,
  WitnessInput,
} from '@/app/types';
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
import { useUser } from '@/context/UserContext';
import { Connector, useSignMessage } from 'wagmi';
import { useAddingCredddModal } from '@/context/AddingCredddModalContext';

interface Prover {
  prepare(): Promise<void>;
  prove(_witness: WitnessInput): Promise<Uint8Array>;
}

const SIG_SALT = Buffer.from('0xdd01e93b61b644c842a5ce8dbf07437f', 'hex');

let prover: Comlink.Remote<Prover>;

const useProver = (eligibleGroup: EligibleGroup) => {
  const { user, siwfResponse } = useUser();

  const { address, merkleProof } = eligibleGroup;
  const { signMessageAsync } = useSignMessage();
  const { setIsOpen: setIsAddingCredddModalOpen } = useAddingCredddModal();

  useEffect(() => {
    prover = Comlink.wrap<Prover>(
      new Worker(new URL('../lib/prover.ts', import.meta.url))
    );
  }, []);

  const prove = async (
    connector: Connector
  ): Promise<FidAttestationRequestBody | null> => {
    if (prover && user?.fid && siwfResponse) {
      const message = `\n${SIG_SALT}Personae attest:${user?.fid}`;

      await prover.prepare();

      // Sign message with the source key
      const sig = await signMessageAsync({
        message,
        account: address,
        connector,
      });

      // The user has signed the message so we open
      // the "Adding Creddd" modal
      setIsAddingCredddModalOpen(true);

      const { s, r, v } = hexToSignature(sig);

      if (!v) {
        throw new Error('Signature recovery value not found');
      }

      const isYOdd = calculateSigRecovery(v);

      const msgHash = hashMessage(message);

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
        root: merkleProof.root,
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
          groupId: eligibleGroup.id,
          issuedAt: issuedAt[0],
        };
      }

      return null;
    } else {
      console.error('Not ready to prove');
    }

    return null;
  };

  return { prove };
};

export default useProver;
