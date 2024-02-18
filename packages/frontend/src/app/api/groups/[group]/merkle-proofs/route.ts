export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';

const merkleTreeSelect = {
  merkleRoot: true,
  merkleProofs: {
    select: {
      path: true,
      pathIndices: true,
      address: true,
    },
  },
} satisfies Prisma.MerkleTreeSelect;

export type MerkleTreeSelect = Prisma.MerkleTreeGetPayload<{
  select: typeof merkleTreeSelect;
}>;

// Get merkle tree and its merkle proofs
export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      group: string;
    };
  }
) {
  const groupId = Number(params.group);

  const group = await prisma.group.findUnique({
    select: {
      id: true,
    },
    where: {
      id: groupId,
    },
  });

  if (!group) {
    return Response.json(
      {
        error: 'Group not found',
      },
      {
        status: 400,
      }
    );
  }

  // Get the latest merkle tree from the database
  const merkleTree = await prisma.merkleTree.findFirst({
    select: merkleTreeSelect,
    where: {
      groupId: group.id,
    },
    orderBy: {
      blockNumber: 'desc',
    },
  });

  // Get the next userId from the database
  return Response.json(merkleTree, { status: 200 });
}
