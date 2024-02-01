import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { NewAttestationRequestBody } from '@/app/types';
import { fromHexString, toHexString } from '@/lib/utils';
import { Prisma } from '@prisma/client';
// @ts-ignore
import * as circuit from 'circuit-node/circuits_embedded';

let circuitInitialized = false;

/**
 * Verify and save a zero-knowledge attestation
 */
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
  const body = (await request.json()) as NewAttestationRequestBody;
  const proof = fromHexString(body.proof);
  const pubKey = params.pubKey;

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

  // Save the attestation to the database
  await prisma.attestation.create({
    data: {
      signerPublicKey: body.targetPubKey,
      proof: fromHexString(body.proof),
      merkleRoot: toHexString(merkleRoot),
    },
  });

  return Response.json({}, { status: 200 });
};

const selectAttestations = {
  merkleRoot: true,
} satisfies Prisma.AttestationSelect;

export type AttestationSelect = Prisma.AttestationGetPayload<{
  select: typeof selectAttestations;
}>;

export const GET = async (
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      pubKey: string;
    };
  }
) => {
  const pubKey = params.pubKey;
  const signerAttestations = await prisma.attestation.findMany({
    where: {
      signerPublicKey: pubKey,
    },
    select: selectAttestations,
  });

  return Response.json(signerAttestations);
};
