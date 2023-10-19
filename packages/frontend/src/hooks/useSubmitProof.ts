import { SubmitData } from '@/types';
import axios from 'axios';
import { useState } from 'react';

export const useSubmitProof = () => {
  const [submittingProof, setSubmittingProof] = useState<boolean>(false);

  const submitProof = async (body: SubmitData): Promise<string> => {
    setSubmittingProof(true);
    const res = await axios.post('/api/proofs', body);
    setSubmittingProof(false);
    return res.data.proofHash;
  };

  return { submittingProof, submitProof };
};
