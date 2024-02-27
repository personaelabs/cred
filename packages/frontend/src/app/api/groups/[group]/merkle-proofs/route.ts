export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';

const merkleTreeSelect = {
  id: true,
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
  req: NextRequest,
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

  const skip = parseInt(req.nextUrl.searchParams.get('skip') || '0');
  const take = parseInt(req.nextUrl.searchParams.get('take') || '30000');

  const paginatedSelect = {
    ...merkleTreeSelect,
    merkleProofs: {
      take: take + 1,
      skip,
      select: merkleTreeSelect.merkleProofs.select,
    },
  };

  // Get the latest merkle tree from the database
  const merkleTree = await prisma.merkleTree.findFirst({
    select: paginatedSelect,
    where: {
      groupId: group.id,
    },
    orderBy: {
      blockNumber: 'desc',
    },
  });

  if (!merkleTree) {
    return Response.json(
      {
        error: 'Merkle tree not found',
      },
      {
        status: 500,
      }
    );
  }

  if (merkleTree.merkleProofs.length === 0) {
    return new Response(null, {
      status: 204,
    });
  }

  if (merkleTree.merkleProofs.length === take + 1) {
    // Remove the last merkle proof
    merkleTree.merkleProofs.pop();
  }

  // Get the next userId from the database
  return Response.json(merkleTree, { status: 200 });
}
