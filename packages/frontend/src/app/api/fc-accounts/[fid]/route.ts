export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import * as neynar from '@/lib/neynar';
import { NeynarUserResponse } from '@/app/types';
import { getUserScore } from '@/lib/score';
import { withHandler } from '@/lib/utils';

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
  return withHandler(async () => {
    const fid = Number(params.fid);

    const userCredddGroupIds = (await prisma.user.findUnique({
      select: {
        groupIds: true,
      },
      where: {
        fid,
      },
    })) ?? { groupIds: [] };

    // Get the `Group` records that match the user's `creddd`.
    // TODO: This and the above query should be combined into a single query for performance.
    const userGroups = await prisma.group.findMany({
      select: groupSelect,
      where: {
        id: {
          in: userCredddGroupIds.groupIds,
        },
      },
    });

    const score = await getUserScore(fid);

    // Get user data from Neynar
    const user = await neynar.getUser(fid);

    if (!user) {
      return Response.json('User not found', { status: 404 });
    }

    // Return user data and attestations
    return Response.json({
      ...user,
      score: score,
      groups: userGroups,
    });
  });
}
