import { useCallback } from 'react';
import axios from 'axios';
import { MembershipProof } from '@prisma/client';

export const useGetUserProofs = () => {
  const getUserProofs = useCallback(
    async (handle: string, includeProofs: boolean): Promise<MembershipProof[]> => {
      const { data } = await axios.get(`/api/users/${handle}/proofs`, {
        params: { includeProofs },
      });
      return data;
    },
    [],
  );

  return getUserProofs;
};
