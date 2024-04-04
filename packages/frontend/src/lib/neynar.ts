import 'dotenv/config';
import axios from 'axios';
import { NeynarUserResponse } from '@/app/types';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60, checkperiod: 70 });

const neynar = axios.create({
  baseURL: 'https://api.neynar.com/v2/farcaster',
  headers: {
    accept: 'application/json',
    api_key: process.env.NEYNAR_API_KEY,
  },
});

/**
 * Get user data for a given FID from Neynar
 * The data is cached for 60 seconds
 */
export const getUser = async (
  fid: number
): Promise<NeynarUserResponse | null> => {
  // Check cache
  const cacheData = cache.get<NeynarUserResponse>(`user-${fid}`);

  if (cacheData) {
    console.log('getUser: cache hit');
    return cacheData;
  } else {
    console.log('getUser: cache miss');
  }

  const result = await neynar.get<{ users: NeynarUserResponse[] }>(
    `/user/bulk?fids=${fid}`
  );

  if (!result.data.users.length) {
    return null;
  }

  const user = result.data.users[0];

  // Cache data
  cache.set(`user-${fid}`, user);

  return user;
};

export default neynar;
