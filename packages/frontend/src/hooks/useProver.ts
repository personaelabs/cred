'use client';

import * as Comlink from 'comlink';
import {
  EligibleGroup,
  FidAttestationRequestBody,
  WitnessInput,
} from '@/app/types';
import {
  calculateSigRecovery,
  captureFetchError,
  concatUint8Arrays,
  fromHexString,
  postJSON,
  toHexString,
} from '@/lib/utils';
import {
  Hex,
  hashMessage,
  hexToBytes,
  hexToCompactSignature,
  hexToSignature,
} from 'viem';
import { Connector, useSignMessage } from 'wagmi';
import { useAddingCredddModal } from '@/context/AddingCredddModalContext';
import useSignedInUser from './useSignedInUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Prover {
  prepare(): Promise<void>;
  prove(_witness: WitnessInput): Promise<Uint8Array>;
}

const SIG_SALT = Buffer.from('0xdd01e93b61b644c842a5ce8dbf07437f', 'hex');

const submitProof = async (proof: FidAttestationRequestBody) => {
  const response = await postJSON({
    method: 'POST',
    url: '/api/attestations',
    body: proof,
  });

  if (response.ok) {
    toast.success('creddd added', {
      duration: 10000,
      closeButton: true,
    });
  } else {
    await captureFetchError(response);

    toast.error('Failed to add creddd', {
      duration: 100000,
      closeButton: true,
    });

    throw new Error('Failed to add creddd');
  }
};

const useProver = (eligibleGroup: EligibleGroup) => {
  const { data: user } = useSignedInUser();

  const { address, merkleProof } = eligibleGroup;
  const { signMessageAsync } = useSignMessage();
  const { setIsOpen: setIsAddingCredddModalOpen } = useAddingCredddModal();
  const queryClient = useQueryClient();

  return useMutation({
    onSuccess: () => {
      // Invalidate the signed-in user query to refetch the user data
      queryClient.invalidateQueries({ queryKey: ['signed-in-user'] });
    },
    mutationFn: async (connector: Connector) => {
      if (user) {
        const prover = Comlink.wrap<Prover>(
          new Worker(new URL('../lib/prover.ts', import.meta.url))
        );
        const message = `\n${SIG_SALT}Personae attest:${user.fid}`;

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

        if (!user.siwfResponse.signature) {
          throw new Error('SIWF response signature not found');
        }

        const { yParityAndS: signInSigS } = hexToCompactSignature(
          user.siwfResponse.signature
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
          const issuedAt = user.siwfResponse.message?.match(
            /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/
          );

          if (!issuedAt || issuedAt.length === 0) {
            throw new Error('Could not extract `issuedAt` from SIWF message');
          }

          const requestBody: FidAttestationRequestBody = {
            proof: toHexString(proof),
            signInSig: user.siwfResponse.signature,
            custody: user.siwfResponse.custody!,
            signInSigNonce: user.siwfResponse.nonce,
            fid: user.fid,
            groupId: eligibleGroup.id,
            issuedAt: issuedAt[0],
          };

          await submitProof(requestBody);
        }
      } else {
        throw new Error('User not found');
      }
    },
  });
};

export default useProver;
