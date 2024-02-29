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
 * Get the custody and verified addresses of the given FIDs
 */
export const getUserAddresses = async (fids: number[]): Promise<Hex[]> => {
  const queryParams = new URLSearchParams();
  queryParams.append('fids', fids.join(','));
  const result = await neynar.get(`/user/bulk?${queryParams.toString()}`);

  const addresses = result.data.users.map((user: any) => [
    user.custody_address as Hex,
    ...((user.verified_addresses.eth_addresses as Hex[]) || []),
  ]);

  return addresses.flat();
};

export default neynar;
