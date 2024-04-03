export const dynamic = 'force-dynamic';
import { FidAttestationRequestBody } from '@/app/types';
const SIG_SALT = Buffer.from('0xdd01e93b61b644c842a5ce8dbf07437f', 'hex');

import prisma from '@/lib/prisma';
import {
  createClient,
  verifySignInMessage,
  viemConnector,
} from '@farcaster/auth-client';
import { NextRequest } from 'next/server';
import {
  bytesToHex,
  hashMessage,
  hexToBytes,
  hexToCompactSignature,
  toHex,
} from 'viem';
// @ts-ignore
import * as circuit from 'circuit-node/circuits_embedded';
import { buildSiwfMessage, getFidAttestationHashV1 } from '@/lib/utils';

let circuitInitialized = false;

// Initialize the SIWF client
const client = createClient({
  relay: 'https://relay.farcaster.xyz',
  ethereum: viemConnector({
    rpcUrl: 'https://mainnet.optimism.io',
  }),
});

// Verify and save a new FID attestation
export async function POST(req: NextRequest) {
  const body = (await req.json()) as FidAttestationRequestBody;

  // Build the SIWF message that is expected to be signed by the user
  const siweMessage = buildSiwfMessage({
    domain: 'creddd.xyz',
    address: body.custody,
    siweUri: 'http://creddd.xyz/login',
    nonce: body.signInSigNonce,
    issuedAt: body.issuedAt,
    fid: body.fid,
  });

  // 1. Verify `signInSig`
  const { success, fid } = await verifySignInMessage(client, {
    nonce: body.signInSigNonce,
    message: siweMessage,
    domain: 'creddd.xyz',
    signature: body.signInSig,
  });

  if (!success) {
    return Response.json({ error: 'Invalid SIFW signature' }, { status: 400 });
  }

  if (fid !== Number(body.fid)) {
    return Response.json({ error: 'Invalid FID' }, { status: 400 });
  }

  // 2. Verify the proof

  const proofBytes = hexToBytes(body.proof);
  if (!circuitInitialized) {
    await circuit.prepare();
    circuitInitialized = true;
  }
  const isVerified = await circuit.verify_membership(proofBytes);

  if (!isVerified) {
    return Response.json({ error: 'Invalid proof' }, { status: 400 });
  }

  const signInSigSInBody = hexToCompactSignature(body.signInSig).yParityAndS;

  // 3. Verify that the `signInSig` in the POST body matches the `signInSig` in the proof
  const signInSigS = toHex(await circuit.get_sign_in_sig(proofBytes));
  if (signInSigS !== signInSigSInBody) {
    return Response.json(
      { error: 'Invalid signInSig in proof' },
      { status: 400 }
    );
  }

  // 4. Verify the merkle root

  const merkleRootBytes = await circuit.get_merkle_root(proofBytes);
  const merkleRoot = bytesToHex(merkleRootBytes);

  const merkleTreeInDb = await prisma.merkleTree.findUnique({
    select: {
      merkleRoot: true,
    },
    where: {
      id: body.treeId,
    },
  });

  if (!merkleTreeInDb) {
    return Response.json({ error: 'Merkle root not found' }, { status: 400 });
  }

  // Pad the merkle root returned from the db to 32 bytes.
  // The merkle root in the database is stored as a hex string but isn't padded to 32 bytes so we need to pad it here.
  const merkleRootInDb = `0x${merkleTreeInDb.merkleRoot
    .replace('0x', '')
    .padStart(64, '0')}`;

  // For debugging
  console.log('merkleRoot', merkleRoot);
  console.log('merkleRootInDb', merkleRootInDb);

  if (merkleRoot !== merkleRootInDb) {
    return Response.json({ error: 'Invalid merkle root' }, { status: 400 });
  }

  // 5. Verify the signed message in the proof

  const message = `\n${SIG_SALT}Personae attest:${fid}`;
  const expectedMsgHash = await hashMessage(message);
  // Get the message hash from the proof
  const msgHash = bytesToHex(await circuit.get_msg_hash(proofBytes));

  if (msgHash !== expectedMsgHash) {
    return Response.json({ error: 'Invalid message' }, { status: 400 });
  }

  const attestationHash = getFidAttestationHashV1(merkleRoot, fid);

  const attestationExists = await prisma.fidAttestation.findUnique({
    select: {
      hash: true,
    },
    where: {
      hash: attestationHash,
    },
  });

  if (attestationExists) {
    return Response.json(
      { error: 'Attestation already exists' },
      { status: 400 }
    );
  }

  // Save the attestation to the database
  await prisma.fidAttestation.create({
    data: {
      hash: attestationHash,
      fid: fid,
      signInSig: Buffer.from(hexToBytes(body.signInSig)),
      attestation: Buffer.from(proofBytes),
      treeId: body.treeId,
    },
  });

  return Response.json('OK', { status: 200 });
}
