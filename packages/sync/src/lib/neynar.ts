import axios from 'axios';
import { NeynarUserResponse } from '../types';
import { Hex } from 'viem';

const neynar = axios.create({
  baseURL: 'https://api.neynar.com/v2/farcaster',
  headers: {
    accept: 'application/json',
    api_key: process.env.NEYNAR_API_KEY,
  },
});

export const getVerifiedAddresses = async (fid: string): Promise<Hex[]> => {
  const result = await neynar.get<{ users: NeynarUserResponse[] }>(
    `/user/bulk?fids=${fid}`
  );

  if (!result.data.users.length) {
    return [];
  }

  const user = result.data.users[0];

  return user.verifications;
};
