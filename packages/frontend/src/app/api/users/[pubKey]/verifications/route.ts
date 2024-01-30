import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { VerifyRequestBody } from '@/app/types';
import { fromHexString, toHexString } from '@/lib/utils';

let circuit: any;
let circuitInitialized = false;
// Verify creddd proof
export const POST = async (
  request: NextRequest,
  {
    params,
  }: {
    params: {
      pubKey: string;
    };
  }
) => {
  const body = (await request.json()) as VerifyRequestBody;
  const proof = fromHexString(body.proof);
  const pubKey = params.pubKey;
  const username = body.username;

  // Check that the pubKey in the URL matches the pubKey in the body
  if (pubKey !== body.targetPubKey) {
    return Response.json(
      {
        error: 'Public key mismatch',
      },
      {
        status: 400,
      }
    );
  }

  if (!circuitInitialized) {
    // @ts-ignore
    circuit = await import('circuit-node/circuits_embedded');
    await circuit.prepare();
    await circuit.init_panic_hook();
    circuitInitialized = true;
  }

  const verified = await circuit.verify_membership(proof);

  if (!verified) {
    return Response.json(
      {
        error: 'Invalid proof',
      },
      {
        status: 401,
      }
    );
  }

  // Extract the Merkle root from the proof
  const merkleRoot = await circuit.get_merkle_root(proof);

  // TODO: Verify the message hash

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    return Response.json(
      {
        error: 'User not found',
      },
      {
        status: 400,
      }
    );
  }

  // Save the verification to the database
  await prisma.verification.create({
    data: {
      username,
      publicKey: body.targetPubKey,
      proof: fromHexString(body.proof),
      merkleRoot: toHexString(merkleRoot),
    },
  });

  return Response.json({}, { status: 200 });
};

const selectVerification = {
  proof: true,
  merkleRoot: true,
  User: {
    select: {
      username: true,
    },
  },
  MerkleTree: {
    select: {
      Group: {
        select: {
          handle: true,
          displayName: true,
          logo: true,
        },
      },
    },
  },
} satisfies Prisma.VerificationSelect;

export type VerificationSelect = Prisma.VerificationGetPayload<{
  select: typeof selectVerification;
}>;

// Get verifications for a user
export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      pubKey: string;
    };
  }
) {
  const { pubKey } = params;
  const verifications = await prisma.verification.findMany({
    select: selectVerification,
    where: {
      publicKey: pubKey,
    },
  });

  return Response.json(verifications, { status: 200 });
}
