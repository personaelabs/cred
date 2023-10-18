import { FcProfile } from '@/types';
import { useCallback, useState } from 'react';
import axios from 'axios';

// Fetch the `FcProfile` object for a given Farcaster ID
export const useFcProfile = () => {
  const [fcProfile, setFcProfile] = useState<FcProfile | null>(null);

  const getFcProfile = useCallback(async (fid: string) => {
    const { data } = await axios.get(`/api/fc/${fid}`);
    setFcProfile(data);
  }, []);

  return { fcProfile, getFcProfile };
};
