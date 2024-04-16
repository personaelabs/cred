export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import * as neynar from '@/lib/neynar';
import { getLeaderboardUsers } from '@/lib/score';
import { withHandler } from '@/lib/utils';

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export async function GET(_req: NextRequest) {
  return withHandler(async () => {
    // NOTE: this has creddd attached
    const leaderBoardData = await getLeaderboardUsers();
    const fids = leaderBoardData.map(record => record.fid);

    // Get user data from Neynar
    const userData = await neynar.getUsers(fids);

    const leaderBoardWithUserData = leaderBoardData.map(record => {
      const user = userData.find(u => u.fid === record.fid);
      return {
        fid: record.fid,
        user,
        creddd: record.creddd,
        score: record.score,
      };
    });

    // Return user data and attestations
    return Response.json(leaderBoardWithUserData);
  });
}
