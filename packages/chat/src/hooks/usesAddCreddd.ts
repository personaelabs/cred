import * as Comlink from 'comlink';
import {
  EligibleCreddd,
  FidAttestationRequestBody,
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
import { calculateSigRecovery, concatUint8Arrays } from '@/lib/utils';
import useSignedInUser from './useSignedInUser';
import { fromHexString } from './useEligibleCreddd';
import credddApi from '@/lib/credddApi';

const SIG_SALT = Buffer.from('0xdd01e93b61b644c842a5ce8dbf07437f', 'hex');

interface Prover {
  prepare(): Promise<void>;
  prove(_witness: WitnessInput): Promise<Uint8Array>;
}

const submitProof = async ({
  proof,
  groupId,
  signedInUser,
}: {
  proof: Uint8Array;
  groupId: string;
  signedInUser: SignedInUser;
}) => {
  // Submit proof to the backend

  const body: FidAttestationRequestBody = {
    groupId,
    proof: toHex(proof),
    siwfResponse: signedInUser,
  };

  await credddApi.post('/api/attestations', body);
};

const useAddCreddd = () => {
  const { signMessageAsync } = useSignMessage();
  const { data: signedInUser } = useSignedInUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (creddd: EligibleCreddd) => {
      if (!signedInUser) {
        throw new Error('User not signed in');
      }

      const { address, merkleProof } = creddd;
      const message = `\n${SIG_SALT}Personae attest:${signedInUser.id}`;

      const prover = Comlink.wrap<Prover>(
        new Worker(new URL('../lib/prover.ts', import.meta.url))
      );

      await prover.prepare();

      // Sign message with the source key
      const sig = await signMessageAsync({
        message,
        account: address,
      });

      const { s, r, v } = hexToSignature(sig);

      if (!v) {
        throw new Error('Signature recovery value not found');
      }

      const isYOdd = calculateSigRecovery(v);
      const msgHash = hashMessage(message);

      const { yParityAndS: signInSigS } = hexToCompactSignature(
        signedInUser.signature!
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

      await submitProof({
        proof,
        groupId: creddd.id,
        signedInUser,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-creddd'] });
      await queryClient.invalidateQueries({ queryKey: ['eligible-creddd'] });
    },
  });
};

export default useAddCreddd;
