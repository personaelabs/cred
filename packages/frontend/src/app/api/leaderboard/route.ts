export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import * as neynar from '@/lib/neynar';
import { getLeaderboardUsers } from '@/lib/score';

export async function GET(_req: NextRequest) {
  // NOTE: this has creddd attached
  const leaderBoardData = await getLeaderboardUsers();
  const fids = leaderBoardData.map(record => record.fid);

  // Get user data from Neynar
  const userData = await neynar.getUsers(fids);

  const leaderBoardWithUserData = leaderBoardData
    .map(record => {
      const user = userData.find(u => u.fid === record.fid);
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
