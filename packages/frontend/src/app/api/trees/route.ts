export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';

const merkleTreeSelect = {
  id: true,
  bloomFilter: true,
  bloomNumBits: true,
  bloomNumHashes: true,
  bloomSipKeys: true,
  Group: {
    select: {
      id: true,
      displayName: true,
      type: true,
    },
  },
} satisfies Prisma.MerkleTreeSelect;

export type MerkleTreeSelect = Prisma.MerkleTreeGetPayload<{
  select: typeof merkleTreeSelect;
}>;

// Get all groups from the database
export async function GET(_req: NextRequest) {
  const groups = await prisma.merkleTree.findMany({
    select: merkleTreeSelect,
  });

  return Response.json(groups, { status: 200 });
}
