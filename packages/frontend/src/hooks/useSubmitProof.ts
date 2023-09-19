import { FullProof } from '@/types';
import axios from 'axios';

export const useSubmitProof = () => {
  const submitProof = async (fullProof: FullProof) => {
    await axios.post('/api/proofs', fullProof);
  };

  return submitProof;
};
