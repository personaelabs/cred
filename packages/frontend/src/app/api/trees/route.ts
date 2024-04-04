export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { GroupType } from '@prisma/client';
import { NextRequest } from 'next/server';

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

type MerkleTreeQueryResult = {
  id: number;
  bloomFilter: Buffer | null;
  bloomNumHashes: number;
  bloomNumBits: number;
  bloomSipKeys: Buffer[];
  groupId: number;
  groupName: string;
  groupScore: number;
  groupType: GroupType;
};

export type MerkleTreeSelect = {
  id: number;
  bloomFilter: Buffer | null;
  treeProtoBuf?: Buffer;
  bloomSipKeys?: Buffer[];
  bloomNumHashes?: number;
  bloomNumBits?: number;
  Group: {
    id: string;
    displayName: string;
    score: number;
    typeId: GroupType;
  };
};
// Get all groups from the database
export async function GET(_req: NextRequest) {
  const result = await prisma.$queryRaw<MerkleTreeQueryResult[]>`
    SELECT DISTINCT ON ("Group".id)
    "MerkleTree".id,
    "bloomFilter",
    "bloomNumBits",
    "bloomNumHashes",
    "bloomSipKeys",
    "Group"."displayName" as "groupName",
    "Group".score as "groupScore",
    "Group"."typeId" as "groupType",
    "Group".id as "groupId"
  FROM
    "MerkleTree"
    LEFT JOIN "Group" ON "MerkleTree"."groupId" = "Group".id
    WHERE "MerkleTree"."bloomFilter" IS NOT NULL
    AND "Group".state = 'Recordable'
  ORDER BY
    "Group".id,
    "MerkleTree"."blockNumber" DESC
  `;

  const merkleTrees = result.map(tree => ({
    id: tree.id,
    bloomFilter: tree.bloomFilter,
    bloomSipKeys: tree.bloomSipKeys,
    bloomNumHashes: tree.bloomNumHashes,
    bloomNumBits: tree.bloomNumBits,
    Group: {
      id: tree.groupId,
      displayName: tree.groupName,
      score: tree.groupScore,
      typeId: tree.groupType,
    },
  }));

  return Response.json(merkleTrees, {
    status: 200,
  });
}
