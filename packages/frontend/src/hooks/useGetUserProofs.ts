import { useState } from 'react';
import { useCallback } from 'react';
import axios from 'axios';
import { MembershipProof } from '@prisma/client';

export const useGetUserProofs = () => {
  const [userProofs, setUserProofs] = useState<MembershipProof[] | undefined>();

  const getUserProofs = useCallback(async (handle: string) => {
    const { data } = await axios.get(`/api/users/${handle}/proofs`, {
      params: { includeProofs: true },
    });
    setUserProofs(data);
  }, []);

  return { userProofs, getUserProofs };
};
