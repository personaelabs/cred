export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { AddressToGroupsMap, Groups } from '@/proto/address_to_groups_pb';

interface AddressToGroupsQueryResult {
  address: string;
  groups: number[];
}

// Get a list of addresses and the groups they belong to
export async function GET(req: NextRequest) {
  const skip = parseInt(req.nextUrl.searchParams.get('skip') || '0');
  const take = parseInt(req.nextUrl.searchParams.get('take') || '50000');

  const result = await prisma.$queryRaw<AddressToGroupsQueryResult[]>`
    WITH large_enough_trees AS (
      SELECT
        "treeId"
      FROM
        "MerkleProof"
      GROUP BY
        "treeId"
      HAVING
        count(*) > 100
    ),
    static_trees AS (
      SELECT
        "MerkleTree".id
      FROM
        "MerkleTree"
      LEFT JOIN "Group" ON "Group".id = "MerkleTree"."groupId"
    WHERE
      "Group".TYPE = 'static'
    )
    SELECT
      "MerkleProof".address, ARRAY_AGG("Group".id) AS "groups"
    FROM
      "MerkleProof"
      LEFT JOIN "MerkleTree" ON "MerkleProof"."treeId" = "MerkleTree".id
      LEFT JOIN "Group" ON "Group".id = "MerkleTree"."groupId"
    WHERE
      "MerkleTree".id IN(
        SELECT
          "treeId" FROM large_enough_trees)
      OR "MerkleTree".id in(
        SELECT
          "id" FROM static_trees)
        GROUP BY
	"MerkleProof".address
    OFFSET ${skip}
    LIMIT ${take}
  `;

  if (result.length === 0) {
    // Return a 204 No Content response if there are no results
    return new NextResponse(null, {
      status: 204,
    });
  }

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
}
