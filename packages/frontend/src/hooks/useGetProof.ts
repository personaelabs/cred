import { FullProof } from '@/types';
import axios from 'axios';
import { Hex } from 'viem';

export const useGetProof = () => {
  const getProof = async (proofHash: Hex): Promise<FullProof> => {
    const { data } = await axios.get(`/api/proofs/${proofHash}`);
    return data;
  };

  return getProof;
};
