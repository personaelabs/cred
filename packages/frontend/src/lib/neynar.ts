import 'dotenv/config';
import axios from 'axios';
import { Hex } from 'viem';

const neynar = axios.create({
  baseURL: 'https://api.neynar.com/v2/farcaster',
  headers: {
    accept: 'application/json',
    api_key: process.env.NEYNAR_API_KEY,
  },
});

/**
 * Get the custody address of the given FID
 */
export const getCustodyAddress = async (fid: number): Promise<Hex> => {
  const queryParams = new URLSearchParams();
  queryParams.append('fids', fid.toString());
  const result = await neynar.get(`/user/bulk?${queryParams.toString()}`);

  if (result.data.users.length === 0) {
    throw new Error('User not found');
  }

  return result.data.users[0].custody_address as Hex;
};

export default neynar;
