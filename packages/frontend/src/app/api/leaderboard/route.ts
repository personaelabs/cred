export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import neynar from '@/lib/neynar';
import { NeynarUserResponse } from '@/app/types';
import { getLeaderboardUsers } from '@/lib/score';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60, checkperiod: 70 });

export async function GET(_req: NextRequest) {
  // Check cache
  const cacheData = cache.get('leaderboard');
  if (cacheData) {
    console.log('leaderboard: cache hit');
    return Response.json(cacheData);
  } else {
    console.log('leaderboard: cache miss');
  }

  // NOTE: this has creddd attached
  const leaderBoardData = await getLeaderboardUsers();
  const fids = leaderBoardData.map(record => record.fid);

  // Get user data from Neynar
  const userData = await neynar.get<{ users: NeynarUserResponse[] }>(
    `/user/bulk?fids=${fids.join(',')}`
  );

  const leaderBoardWithUserData = leaderBoardData
    .map(record => {
      const user = userData.data.users.find(u => u.fid === record.fid);
      return {
        fid: record.fid,
        user,
        creddd: record.creddd,
        score: record.score,
      };
    })
    // Sort by score
    .sort((a, b) => b.score - a.score);

  // Cache data
  cache.set('leaderboard', leaderBoardWithUserData);

  // Return user data and attestations
  return Response.json(leaderBoardWithUserData);
}
