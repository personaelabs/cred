import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { AddressToGroupsMap, Groups } from '@/proto/address_to_groups_pb';

interface AddressToGroupsQueryResult {
  address: string;
  groups: number[];
}

// Get a list of addresses and the groups they belong to
export async function GET(_req: NextRequest) {
  const result = await prisma.$queryRaw<AddressToGroupsQueryResult[]>`
    WITH large_enough_trees AS (
      SELECT
        "merkleRoot"
      FROM
        "MerkleProof"
      GROUP BY
        "merkleRoot"
      HAVING
        count(*) > 100
    )
    SELECT
      "MerkleProof".address,
      ARRAY_AGG("Group".id) AS "groups"
    FROM
      "MerkleProof"
      LEFT JOIN "MerkleTree" ON "MerkleProof"."merkleRoot" = "MerkleTree"."merkleRoot"
      LEFT JOIN "Group" ON "Group".id = "MerkleTree"."groupId"
    WHERE "MerkleTree"."merkleRoot" IN ( SELECT "merkleRoot" FROM large_enough_trees)
    GROUP BY
      "MerkleProof".address
  `;

  const addressesToGroups = new AddressToGroupsMap();
  const map = addressesToGroups.getAddresstogroupsMap();

  for (const row of result) {
    const groups = new Groups();
    groups.setGroupsList(row.groups);
    map.set(row.address, groups);
  }

  return new NextResponse(addressesToGroups.serializeBinary(), {
    headers: {
      'Content-Type': 'application/x-protobuf',
    },
  });

  return new NextResponse(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
