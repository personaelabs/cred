export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      treeId: string;
    };
  }
) {
  const id = Number(params.treeId);

  const merkleTree = await prisma.merkleTree.findUnique({
    select: {
      id: true,
      treeProtoBuf: true,
    },
    where: {
      id,
    },
  });

  if (!merkleTree) {
    return Response.json(
      {
        error: 'Merkle Tree not found',
      },
      {
        status: 400,
      }
    );
  }

  if (!merkleTree.treeProtoBuf) {
    return Response.json(
      {
        error: 'Merkle tree is empty',
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
