export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import neynar from '@/lib/neynar';
import { NeynarUserResponse } from '@/app/types';
import prisma from '@/lib/prisma';

interface Creddd10QueryResult {
  fid: number;
  score: number;
  groups: string[];
}

export async function GET(_req: NextRequest) {
  const result = await prisma.$queryRaw<Creddd10QueryResult[]>`
    SELECT
    fid,
    sum("Group".score) AS score,
    ARRAY_AGG("Group"."displayName") AS groups
  FROM
    "FidAttestation"
    LEFT JOIN "MerkleTree" ON "FidAttestation"."treeId" = "MerkleTree".id
    LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
  GROUP BY
    fid
  ORDER BY
    score DESC
  LIMIT 10
  `;

  const fids = result.map(r => r.fid);

  // Get user data from Neynar
  const userData = await neynar.get<{ users: NeynarUserResponse[] }>(
    `/user/bulk?fids=${fids.join(',')}`
  );

  const leaderBoardWithUserData = result.map(row => {
    const user = userData.data.users.find(u => u.fid === row.fid);
    const creddd = row.groups;

    return {
      fid: row.fid,
      user,
      creddd,
      score: row.score,
    };
  });

  // Return user data and attestations
  return Response.json(leaderBoardWithUserData);
}
