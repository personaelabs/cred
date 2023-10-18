import { SubmitData } from '@/types';
import axios from 'axios';

export const useSubmitProof = () => {
  const submitProof = async (body: SubmitData): Promise<string> => {
    const res = await axios.post('/api/proofs', body);
    return res.data.proofHash;
  };

  return submitProof;
};
