import 'dotenv/config';
import axios from 'axios';
import { NeynarUserResponse } from '@/types';

if (!process.env.NEYNAR_API_KEY) {
  throw new Error('NEYNAR_API_KEY is not set');
}

const neynar = axios.create({
  baseURL: 'https://api.neynar.com/v2/farcaster',
  headers: {
    accept: 'application/json',
    api_key: process.env.NEYNAR_API_KEY,
  },
});

/**
 * Get user data for a given FID from Neynar
 * The data is cached for 60 seconds in production, and forever in development
 */
export const getUser = async (
  fid: number
): Promise<NeynarUserResponse | null> => {
  const result = await neynar.get<{ users: NeynarUserResponse[] }>(
    `/user/bulk?fids=${fid}`
  );

  if (!result.data.users.length) {
    return null;
  }

  const user = result.data.users[0];

  return user;
};

export default neynar;
