export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import neynar from '@/lib/neynar';
import { NeynarUserResponse } from '@/app/types';
import { getUserScore } from '@/lib/score';

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const groupSelect = {
  id: true,
  typeId: true,
  displayName: true,
} satisfies Prisma.GroupSelect;

export type GroupSelect = Prisma.GroupGetPayload<{
  select: typeof groupSelect;
}>;

export type GetUserResponse = NeynarUserResponse & {
  groups: GroupSelect[];
  score: number;
};

/**
 * Get user data and attestations for a given FID
 */
export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      fid: string;
    };
  }
) {
  const fid = Number(params.fid);

  const userGroups = await prisma.$queryRaw<GroupSelect[]>`
  WITH "user_creddd" AS (
      SELECT
        fid,
        "treeId"
      FROM
        "FidAttestation"
      WHERE
        fid = ${fid}
      UNION
      SELECT
        fid,
        "treeId"
      FROM
        "IntrinsicCreddd"
      WHERE
        fid = ${fid}
    ) SELECT DISTINCT ON ("Group".id)
      "Group".id, "Group"."displayName", "Group"."typeId"
    FROM
      "user_creddd"
      LEFT JOIN "MerkleTree" ON "user_creddd"."treeId" = "MerkleTree".id
      LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
    `;

  const score = await getUserScore(fid);

  // Get user data from Neynar
  const result = await neynar.get<{ users: NeynarUserResponse[] }>(
    `/user/bulk?fids=${fid}`
  );
  const user = result.data.users[0];

  if (!user) {
    return Response.json('User not found', { status: 404 });
  }

  // Return user data and attestations
  return Response.json({
    ...user,
    score: score,
    groups: userGroups,
  });
}
