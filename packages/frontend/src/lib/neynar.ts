import 'dotenv/config';
import axios from 'axios';
import { NeynarUserResponse } from '@/app/types';
import NodeCache from 'node-cache';

import Pool from 'pg-pool';

const cacheTTL = process.env.NODE_ENV === 'development' ? 9999999999 : 60;
console.log('cacheTTL', cacheTTL);
const cache = new NodeCache({ stdTTL: cacheTTL, checkperiod: 70 });

const neynar = axios.create({
  baseURL: 'https://api.neynar.com/v2/farcaster',
  headers: {
    accept: 'application/json',
    api_key: process.env.NEYNAR_API_KEY,
  },
});

// NOTE: not robust to neynar db host/db name changes
const neynarDbConfig = {
  user: process.env.NEYNAR_DB_USER,
  password: process.env.NEYNAR_DB_PWD,
  host: 'db.neynar.com',
  port: 5432,
  database: 'farcaster',
};
const neynarDbPool = new Pool(neynarDbConfig);

export const getFollowingFids = async (fid: number) => {
  const client = await neynarDbPool.connect();
  try {
    const res = await client.query(
      `select distinct target_fid from "links" where fid=${fid} and type='follow'`
    );
    return res.rows.map((row: any) => parseInt(row.target_fid));
  } finally {
    client.release();
  }
};

/**
 * Get user data for a given FID from Neynar
 * The data is cached for 60 seconds in production, and forever in development
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

/**
 * Get users for a given list of FIDs from Neynar
 * The data is cached for 60 seconds in production, and forever in development
 */
export const getUsers = async (
  fids: number[]
): Promise<NeynarUserResponse[]> => {
  // Check cache for each FID
  const cacheData = fids.map(fid =>
    cache.get<NeynarUserResponse>(`user-${fid}`)
  );

  const missingFids = fids.filter((fid, index) => !cacheData[index]);

  if (!missingFids.length) {
    // All data is in the cache
    console.log('getUsers: cache hit');
    return cacheData as NeynarUserResponse[];
  } else {
    console.log('getUsers: cache miss');
    // Get all FIDs from Neynar (including the ones that were in the cache)
    const result = await neynar.get<{ users: NeynarUserResponse[] }>(
      `/user/bulk?fids=${fids.join(',')}`
    );

    // Cache data
    result.data.users.forEach(user => {
      cache.set(`user-${user.fid}`, user);
    });

    return result.data.users;
  }
};

export default neynar;
