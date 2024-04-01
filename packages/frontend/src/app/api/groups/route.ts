export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
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
  typeId: true,
  score: true,
} satisfies Prisma.GroupSelect;

export type GroupSelect = Prisma.GroupGetPayload<{
  select: typeof groupSelect;
}>;

// Get all groups with a merkle tree from the database
export async function GET(_req: NextRequest) {
  const groups = await prisma.group.findMany({
    select: groupSelect,
    where: {
      merkleTrees: {
        some: {
          treeProtoBuf: {
            not: null,
          },
        },
      },
    },
  });

  return Response.json(groups, {
    status: 200,
  });
}
