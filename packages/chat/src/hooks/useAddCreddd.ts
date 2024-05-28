/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */

import * as Comlink from 'comlink';
import {
  AddCredddRequestBody,
  EligibleCreddd,
  SignedInUser,
  WitnessInput,
} from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSignMessage } from 'wagmi';
import {
  Hex,
  hashMessage,
  hexToBytes,
  hexToCompactSignature,
  hexToSignature,
  toHex,
} from 'viem';
import {
  calculateSigRecovery,
  concatUint8Arrays,
  constructAttestationMessage,
  constructProofAttestationMessage,
  getProofHash,
} from '@/lib/utils';
import useSignedInUser from './useSignedInUser';
import { fromHexString } from '@/lib/utils';
import credddApi from '@/lib/credddApi';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCallback, useState } from 'react';
import axios from '@/lib/axios';

const SIG_SALT = Buffer.from('0xdd01e93b61b644c842a5ce8dbf07437f', 'hex');

const submitProof = async (body: AddCredddRequestBody) => {
  await axios.post('/api/creddd', body);
};

interface Prover {
  prepare(): Promise<void>;
  prove(_witness: WitnessInput): Promise<Uint8Array>;
}

const useAddCreddd = () => {
  const { data: signedInUser } = useSignedInUser();
  const queryClient = useQueryClient();
  const { wallets } = useWallets();
  const [hasSignedMessage, setHasSignedMessage] = useState(false);

  const privyAddress = wallets?.find(
    wallet => wallet.walletClientType === 'privy'
  );

  const signProofHash = useCallback(
    async (proofHash: Hex) => {
      if (!privyAddress) {
        throw new Error("User doesn't have a wallet");
      }

      const proofHashMessage = constructProofAttestationMessage(proofHash);

      const signature = await privyAddress.sign(proofHashMessage);
      return signature as Hex;
    },
    [privyAddress]
  );

  const result = useMutation({
    mutationFn: async (creddd: EligibleCreddd) => {
      if (!signedInUser) {
        throw new Error('User not signed in');
      }

      if (!privyAddress) {
        throw new Error("User doesn't have a wallet");
      }

      const { merkleProof } = creddd;
      const message = constructAttestationMessage(privyAddress.address as Hex);

      const prover = Comlink.wrap<Prover>(
        new Worker(new URL('../lib/prover.ts', import.meta.url))
      );

      await prover.prepare();

      const proverAddress = wallets.find(
        wallet => wallet.address === creddd.address
      );

      if (!proverAddress) {
        throw new Error('Prover address not found');
      }

      // Sign message with the source key
      const sig = await proverAddress.sign(message);
      setHasSignedMessage(true);

      const { s, r, v } = hexToSignature(sig as Hex);

      if (!v) {
        throw new Error('Signature recovery value not found');
      }

      const isYOdd = calculateSigRecovery(v);
      const msgHash = hashMessage(message);

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
        signInSigS: hexToBytes(privyAddress.address as Hex, {
          size: 32,
        }),
      };

      const proof = await prover.prove(witness);
      const proofHex = toHex(proof);
      const proofHashSig = await signProofHash(getProofHash(proofHex));

      await submitProof({
        proof: proofHex,
        privyAddress: privyAddress.address as Hex,
        privyAddressSignature: proofHashSig,
      });

      setHasSignedMessage(false);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-creddd'] });
      await queryClient.invalidateQueries({ queryKey: ['eligible-creddd'] });
    },
  });

  return { ...result, hasSignedMessage };
};

export default useAddCreddd;
