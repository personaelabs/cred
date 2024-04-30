import 'dotenv/config';
import axios from 'axios';
import { NeynarUserResponse } from '@/app/types';
import NodeCache from 'node-cache';

import { PrismaClient } from '@prisma/client';

const cacheTTL = process.env.NODE_ENV === 'development' ? 9999999999 : 60;
const cache = new NodeCache({ stdTTL: cacheTTL, checkperiod: 70 });

const neynar = axios.create({
  baseURL: 'https://api.neynar.com/v2/farcaster',
  headers: {
    accept: 'application/json',
    api_key: process.env.NEYNAR_API_KEY,
  },
});

const neynarDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.NEYNAR_DB_URL,
    },
  },
});

interface NeynarQueryFollowsResult {
  target_fid: number;
}

/**
 * Get the FIDs that a given FID is following
 */
export const getFollowingFids = async (fid: number): Promise<number[]> => {
  const res = await neynarDb.$queryRaw<
    NeynarQueryFollowsResult[]
  >`SELECT DISTINCT
        target_fid
      FROM
        "links"
      WHERE
        fid = ${fid}
        AND TYPE = 'follow'
        AND target_fid IS NOT NULL
        AND deleted_at IS NULL`;

  // Realistically, target_fid won't overflow.
  return res.map(row => Number(row.target_fid));
};

/**
 * Filter a list of fids to those with the active badge on neynar
 * @param fids
 */
export const filterActive = async (fids: number[]) => {
  // enumerate active, then filter to those that are active
  const result = await neynar.get<{ users: NeynarUserResponse[] }>(
    `/user/bulk?fids=${fids.join(',')}`
  );

  if (!result.data.users.length) {
    return [];
  }

  const activeFids = result.data.users
    .filter(user => user['active_status'] === 'active')
    .map(user => user.fid);
  return activeFids;
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
