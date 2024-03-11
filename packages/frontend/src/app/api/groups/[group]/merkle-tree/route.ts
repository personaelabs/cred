export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const merkleTreeSelect = {
  id: true,
  treeProtoBuf: true,
} satisfies Prisma.MerkleTreeSelect;

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

  const treeId = merkleTree.id;

  const treeIdBuff = Buffer.alloc(4);
  treeIdBuff.writeUInt32BE(treeId, 0);

  const response = Buffer.concat([treeIdBuff, merkleTree.treeProtoBuf]);

  return new NextResponse(response, {
    headers: {
      'Content-Type': 'application/x-protobuf',
    },
  });
}
