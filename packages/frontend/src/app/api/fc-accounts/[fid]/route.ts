export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { GroupState, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import * as neynar from '@/lib/neynar';
import { NeynarUserResponse } from '@/app/types';
import { getUserScore } from '@/lib/score';

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const selectAttestation = {
  MerkleTree: {
    select: {
      Group: {
        select: {
          id: true,
          typeId: true,
          displayName: true,
          state: true,
        },
      },
    },
  },
} satisfies Prisma.FidAttestationSelect;

export type FidAttestationSelect = Prisma.FidAttestationGetPayload<{
  select: typeof selectAttestation;
}>;

export type GetUserResponse = NeynarUserResponse & {
  fidAttestations: FidAttestationSelect[];
  score: number;
};

/**
 * Get user data and attestations for a given FID
 */
export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      fid: string;
    };
  }
) {
  const fid = Number(params.fid);

  // Get attestations (i.e. proofs) for the FID
  const fidAttestations = await prisma.fidAttestation.findMany({
    select: selectAttestation,
    where: {
      fid,
    },
  });

  // Filter out invalid groups
  const validAttestations = fidAttestations.filter(
    a => a.MerkleTree.Group.state === GroupState.Recordable
  );

  const score = await getUserScore(fid);

  // Get user data from Neynar
  const user = await neynar.getUser(fid);

  if (!user) {
    return Response.json('User not found', { status: 404 });
  }

  // Return user data and attestations
  return Response.json({
    ...user,
    score: score,
    fidAttestations: validAttestations,
  });
}
