import { FcAnon } from '@/types';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

// Fetch a Farcacster anon account and its proofs
export const useFcAnonAccount = (fid: number) => {
  const [fcAnon, setFcAnon] = useState<FcAnon | undefined>();

  const fetchFcAnon = useCallback(async (fid: number) => {
    const { data }: { data: FcAnon } = await axios.get(`/api/users/fc/${fid}/proofs`);
    setFcAnon(data);
  }, []);

  useEffect(() => {
    if (fid) {
      fetchFcAnon(fid);
    }
  }, [fetchFcAnon, fid]);

  return {
    fcAnon,
  };
};
