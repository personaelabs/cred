import { useState, useCallback } from 'react';
import axios from 'axios';
import { MembershipProof } from '@prisma/client';
import { PublicInput } from '@personaelabs/spartan-ecdsa';
import { ROOT_TO_SET } from '@/lib/sets';
import { Hex } from 'viem';

export const useGetUserSets = () => {
  const [userSets, setUserSets] = useState<string[]>([]);

  const getUserSets = useCallback(async (username: string) => {
    const {
      data,
    }: {
      data: MembershipProof[];
    } = await axios.get(`/api/users/${username}/proofs`, {
      params: {
        includeProofs: false,
      },
    });

    const sets: string[] = [];

    data.forEach((proof) => {
      // We use the `PublicInput` class to extract the merkle root from
      // v1 and v2 proofs.
      if (proof.proofVersion === 'v1' || proof.proofVersion === 'v2') {
        const publicInput = PublicInput.deserialize(
          Buffer.from(proof.publicInput.replace('0x', ''), 'hex'),
        );
        const groupRoot = publicInput.circuitPubInput.merkleRoot;

        sets.push(ROOT_TO_SET[groupRoot.toString()]);

        // The `merkleRoot` field is available for v3 and v4 proofs
      } else if (proof.proofVersion === 'v3' || proof.proofVersion === 'v4') {
        // `proof.merkleRoot` is a comma-separated list of merkle roots
        const merkleRoots = (proof.merkleRoot as Hex)
          .split(',')
          .map((merkleRoot) => BigInt(merkleRoot as Hex).toString(10));

        merkleRoots.forEach((merkleRoot) => {
          sets.push(ROOT_TO_SET[merkleRoot]);
        });
      } else {
        throw new Error(`Unknown proof version: ${proof.proofVersion}`);
      }
    });

    setUserSets(sets);
  }, []);

  return {
    userSets,
    getUserSets,
  };
};
