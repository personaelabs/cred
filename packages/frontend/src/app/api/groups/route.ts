import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';

const groupSelect = {
  handle: true,
  displayName: true,
} satisfies Prisma.GroupSelect;

export type GroupSelect = Prisma.GroupGetPayload<{
  select: typeof groupSelect;
}>;

// Get merkle tree and its merkle proofs
export async function GET(_req: NextRequest) {
  const groups = await prisma.group.findMany({
    select: groupSelect,
  });

  // Get the next userId from the database
  return Response.json(groups, { status: 200 });
}
