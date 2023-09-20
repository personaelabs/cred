import { FullProof } from '@/types';
import axios from 'axios';

export const useSubmitProof = () => {
  const submitProof = async (fullProof: FullProof): Promise<string> => {
    const res = await axios.post('/api/proofs', fullProof);
    return res.data.proofHash;
  };

  return submitProof;
};
