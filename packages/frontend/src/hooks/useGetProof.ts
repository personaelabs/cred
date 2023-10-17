import axios from 'axios';
import { Hex } from 'viem';
import { MembershipProof } from '@prisma/client';

export const useGetProof = () => {
  const getProof = async (proofHash: Hex): Promise<MembershipProof> => {
    const { data } = await axios.get(`/api/proofs/${proofHash}`);
    return data;
  };

  return getProof;
};
