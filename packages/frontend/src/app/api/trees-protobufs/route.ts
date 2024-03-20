export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { MerkleTree, MerkleTreeList } from '@/proto/merkle_tree_pb';
import { NextRequest, NextResponse } from 'next/server';

const MAX_TREES_PRE_REQUEST = 5;

export async function GET(req: NextRequest) {
  const idsString = req.nextUrl.searchParams.get('ids');

  if (!idsString) {
    return Response.json(
      {
        error: 'No ids provided',
      },
      {
        status: 400,
      }
    );
  }

  const ids = idsString.split(',').map(Number);

  if (ids.length > MAX_TREES_PRE_REQUEST) {
    return Response.json(
      {
        error: 'Too many ids provided',
      },
      {
        status: 400,
      }
    );
  }

  const merkleTrees = await prisma.merkleTree.findMany({
    select: {
      id: true,
      treeProtoBuf: true,
    },
    where: {
      id: {
        in: ids,
      },
    },
  });

  for (const id of ids) {
    if (!merkleTrees.some(tree => tree.id === id)) {
      return Response.json(
        {
          error: `Merkle Tree with id ${id} not found`,
        },
        {
          status: 400,
        }
      );
    }
  }

  const treeBuffers = [];

  // Check the validity of each tree and add them to the list
  for (const tree of merkleTrees) {
    if (!tree.treeProtoBuf) {
      return Response.json(
        {
          error: `Merkle tree with id ${tree.id} is empty`,
        },
        {
          status: 500,
        }
      );
    }

    if (tree.treeProtoBuf.length === 0) {
      return Response.json(
        {
          error: `Merkle tree with id ${tree.id} is empty`,
        },
        {
          status: 500,
        }
      );
    }

    treeBuffers.push(tree.treeProtoBuf);
  }

  // Build the MerkleTreeList protobuf

  const treeList = new MerkleTreeList();
  treeList.setTreesList(
    treeBuffers.map(treeBuffer => MerkleTree.deserializeBinary(treeBuffer))
  );

  // Serialize the MerkleTreeList protobuf
  const response = treeList.serializeBinary();

  return new NextResponse(response, {
    headers: {
      'Content-Type': 'application/x-protobuf',
    },
  });
}
