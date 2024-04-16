export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { GroupState, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { MerkleTree, MerkleTreeList } from '@/proto/merkle_tree_pb';
import { withHandler } from '@/lib/utils';

const MAX_TREES_PRE_REQUEST = 5;

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

const selectGroupLatestMerkleTree = {
  id: true,
  merkleTrees: {
    select: {
      id: true,
      treeProtoBuf: true,
    },
    take: 1,
    orderBy: {
      blockNumber: 'desc',
    },
  },
} satisfies Prisma.GroupSelect;

export type GroupMerkleTreeSelect = Prisma.GroupGetPayload<{
  select: typeof selectGroupLatestMerkleTree;
}>;

/**
 * Get the groups with their latest merkle tree from the database.
 * @param groupIds The ids of the groups to get the merkle trees for
 * @returns The HTTP response containing the merkle trees
 */
const handleGetGroupLatestMerkleTrees = async (
  groupIds: string[]
): Promise<NextResponse> => {
  const groups = await prisma.group.findMany({
    select: selectGroupLatestMerkleTree,
    where: {
      id: {
        in: groupIds,
      },
    },
  });

  // Sort the trees by the order of the provided ids
  const sortedGroups = groups.sort((a, b) => {
    return groupIds.indexOf(a.id) - groupIds.indexOf(b.id);
  });

  const treeBuffers = [];

  // Check the validity of each tree and add them to the list
  for (const group of sortedGroups) {
    if (!group.merkleTrees.length) {
      return NextResponse.json(
        {
          error: `Group with id ${group.id} has no merkle trees`,
        },
        {
          status: 500,
        }
      );
    }
    const merkleTree = group.merkleTrees[0];

    if (!merkleTree.treeProtoBuf || merkleTree.treeProtoBuf.length === 0) {
      return NextResponse.json(
        {
          error: `Merkle tree with id ${merkleTree.id} is empty`,
        },
        {
          status: 500,
        }
      );
    }

    treeBuffers.push(merkleTree.treeProtoBuf);
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
};

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const groupIds = req.nextUrl.searchParams.get('groupIds')?.split(',');

    if (groupIds) {
      // If groupIds are provided,
      // return the specified groups with their latest merkle tree

      // Check if the number of groupIds is within the limit.
      // We need this limit because the server refuses to return a response if
      // the response is too large.
      if (groupIds.length > MAX_TREES_PRE_REQUEST) {
        return Response.json(
          {
            error: 'Too many ids provided',
          },
          {
            status: 400,
          }
        );
      }

      return await handleGetGroupLatestMerkleTrees(groupIds);
    } else {
      // If no groupIds are provided,
      // only return the metadata of the groups. (Don't include the merkle trees)
      const groups = await prisma.group.findMany({
        select: groupSelect,
        where: {
          state: GroupState.Recordable,
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
  });
}
