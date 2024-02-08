import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

interface AddressToGroupsQueryResult {
  address: string;
  groups: string;
}

export interface AddressToGroupsResponse {
  [address: string]: string[];
}

// Get a list of addresses and the groups they belong to
export async function GET(_req: NextRequest) {
  const result = await prisma.$queryRaw<AddressToGroupsQueryResult[]>`
    SELECT
      "MerkleProof".address,
      STRING_AGG("Group".handle, ',') AS "groups"
    FROM
      "MerkleProof"
      LEFT JOIN "MerkleTree" ON "MerkleProof"."merkleRoot" = "MerkleTree"."merkleRoot"
      LEFT JOIN "Group" ON "Group".id = "MerkleTree"."groupId"
    GROUP BY
      "MerkleProof".address
  `;

  const addressToGroups: AddressToGroupsResponse = {};
  for (const { address, groups } of result) {
    addressToGroups[address] = groups.split(',');
  }

  return Response.json(addressToGroups, { status: 200 });
}
