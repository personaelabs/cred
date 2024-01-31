import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
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

  // Save the verification to the database
  await prisma.attestation.create({
    data: {
      signerPublicKey: body.targetPubKey,
      proof: fromHexString(body.proof),
      merkleRoot: toHexString(merkleRoot),
    },
  });

  return Response.json({}, { status: 200 });
};
