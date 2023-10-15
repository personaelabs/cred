import axios from 'axios';
import { Hex } from 'viem';

export const useSubmitFcAnonProof = () => {
  const submitProof = async (proof: Hex): Promise<string> => {
    const res = await axios.post('/api/fc-anons/proofs', { proof });
    return res.data.proofHash;
  };

  return submitProof;
};
