import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const selectAttestedSigner = {
  publicKey: true,
  TwitterUser: {
    select: {
      username: true,
    },
  },
  attestations: {
    select: {
      merkleRoot: true,
    },
  },
} satisfies Prisma.SignerSelect;

export type SignerSelect = Prisma.SignerGetPayload<{
  select: typeof selectAttestedSigner;
}>;

export const GET = async (
  request: NextRequest,
  {
    params,
  }: {
    params: {
      pubKey: string;
    };
  }
) => {
  const pubKey = params.pubKey;
  const attestedSigner = await prisma.signer.findUnique({
    where: {
      publicKey: pubKey,
    },
    select: selectAttestedSigner,
  });

  if (!attestedSigner) {
    return Response.json(
      {
        error: 'Not found',
      },
      {
        status: 404,
      }
    );
  }

  return Response.json(attestedSigner);
};
