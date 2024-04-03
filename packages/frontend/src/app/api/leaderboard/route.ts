export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import neynar from '@/lib/neynar';
import { NeynarUserResponse } from '@/app/types';
import { getLeaderboardUsers } from '@/lib/score';

export async function GET(_req: NextRequest) {
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
      console.log(record);
      return {
        fid: record.fid,
        user,
        creddd: record.creddd,
        score: record.score,
      };
    })
    // Sort by score
    .sort((a, b) => b.score - a.score);

  // Return user data and attestations
  return Response.json(leaderBoardWithUserData);
}
