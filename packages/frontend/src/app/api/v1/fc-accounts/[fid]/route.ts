export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { getUserScore } from '@/lib/score';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const groupSelect = {
  id: true,
  displayName: true,
} satisfies Prisma.GroupSelect;

export type GroupSelect = Prisma.GroupGetPayload<{
  select: typeof groupSelect;
}>;

/**
 * Returns the creddd and score of a user
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
      "Group"."displayName"
    FROM
      "user_creddd"
      LEFT JOIN "MerkleTree" ON "user_creddd"."treeId" = "MerkleTree".id
      LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
    WHERE "Group"."state" = 'Recordable'
    `;

  const userScore = await getUserScore(fid);

  // Return user data and attestations
  return Response.json(
    {
      creddd: userGroups.map(group => group.displayName),
      score: userScore,
    },
    {
      status: 200,
    }
  );
}
