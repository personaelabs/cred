import { FidAttestationRequestBody } from '@/app/types';
import { SIG_SALT } from '@/hooks/useProver';
import prisma from '@/lib/prisma';
import { createAppClient, viemConnector } from '@farcaster/auth-kit';
import { NextRequest } from 'next/server';
import { bytesToHex, hashMessage, hexToBytes } from 'viem';

const appClient = createAppClient({
  relay: 'https://relay.farcaster.xyz',
  ethereum: viemConnector(),
});

// TODO: Adjust these to match the frontend implementation
const SIWF_DOMAIN = 'creddd.xyz';
const SIWF_MESSAGE = `${SIWF_DOMAIN} wants you to sign in with your Ethereum account`;

// Verify and save a new FID attestation
export async function POST(req: NextRequest) {
  const body = (await req.json()) as FidAttestationRequestBody;

  // 1. Verify `signInSig`
  const { success, fid } = await appClient.verifySignInMessage({
    nonce: body.signInSigNonce,
    message: SIWF_MESSAGE,
    domain: SIWF_DOMAIN,
    signature: body.signInSig,
  });

  if (!success) {
    return Response.json({ error: 'Invalid SIFW signature' }, { status: 400 });
  }

  // 2. Verify the proof
  const circuit = await import('circuit-node');

  const proofBytes = hexToBytes(body.proof);
  const isVerified = await circuit.verify_membership(proofBytes);

  if (!isVerified) {
    return Response.json({ error: 'Invalid proof' }, { status: 400 });
  }

  // 3. Verify that the `signInSig` in the POST body matches the `signInSig` in the proof
  const signInSig = await circuit.get_sign_in_sig(proofBytes);
  if (signInSig !== body.signInSig) {
    return Response.json(
      { error: 'Invalid signInSig in proof' },
      { status: 400 }
    );
  }

  // 4. Verify the merkle root

  const merkleRootBytes = await circuit.get_merkle_root(proofBytes);
  const merkleRoot = bytesToHex(merkleRootBytes);

  const merkleRootInDb = await prisma.merkleTree.findFirst({
    where: {
      merkleRoot,
    },
  });

  if (!merkleRootInDb) {
    return Response.json({ error: 'Merkle root not found' }, { status: 400 });
  }

  // 5. Verify the message

  const message = `\n${SIG_SALT}Personae attest:${fid}`;
  const expectedMsgHash = await hashMessage(message);
  // Get the message hash from the proof
  const msgHash = bytesToHex(await circuit.get_msg_hash(proofBytes));

  if (msgHash !== expectedMsgHash) {
    return Response.json({ error: 'Invalid message' }, { status: 400 });
  }

  // Save the attestation to the database
  await prisma.fidAttestation.create({
    data: {
      fid: fid,
      signInSig: Buffer.from(hexToBytes(body.sourcePubKeySigHash)),
      attestation: Buffer.from(proofBytes),
      merkleRoot,
    },
  });

  return Response.json('OK', { status: 200 });
}
