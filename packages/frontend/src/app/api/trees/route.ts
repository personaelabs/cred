export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const merkleTreeSelect = {
  id: true,
  bloomFilter: true,
  bloomNumBits: true,
  bloomNumHashes: true,
  bloomSipKeys: true,
  blockNumber: true,
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
  const merkleTrees = await prisma.merkleTree.findMany({
    select: merkleTreeSelect,
  });

  const groupIdToLatestTree = new Map<number, MerkleTreeSelect>();

  // Only return the latest merkle tree for each group
  for (const merkleTree of merkleTrees) {
    const existing = groupIdToLatestTree.get(merkleTree.Group.id);
    if (!existing || existing.blockNumber < merkleTree.blockNumber) {
      groupIdToLatestTree.set(merkleTree.Group.id, merkleTree);
    }
  }

  return Response.json(Array.from(groupIdToLatestTree.values()), {
    status: 200,
  });
}
