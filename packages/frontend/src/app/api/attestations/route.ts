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
  Hex,
  bytesToHex,
  hashMessage,
  hexToBytes,
  hexToCompactSignature,
  toHex,
} from 'viem';
// @ts-ignore
import * as circuit from 'circuit-node/circuits_embedded';
import { getFidAttestationHashV1, withHandler } from '@/lib/utils';
import { addWriterToRoom } from '@cred/firebase';

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
  return withHandler(async () => {
    const body = (await req.json()) as FidAttestationRequestBody;

    // 1. Verify `signInSig`
    const { success, fid } = await verifySignInMessage(client, {
      nonce: body.siwfResponse.nonce,
      message: body.siwfResponse.message as string,
      domain: 'creddd.xyz',
      signature: body.siwfResponse.signature as Hex,
    });

    if (!success) {
      return Response.json(
        { error: 'Invalid SIFW signature' },
        { status: 400 }
      );
    }

    if (fid !== Number(body.siwfResponse.fid)) {
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

    const signInSigSInBody = hexToCompactSignature(
      body.siwfResponse.signature as Hex
    ).yParityAndS;

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
    const merkleRoot = bytesToHex(merkleRootBytes, {
      size: 32,
    });

    const groupMerkleTree = await prisma.merkleTree.findFirst({
      select: {
        id: true,
      },
      where: {
        merkleRoot: merkleRoot,
        groupId: body.groupId,
      },
      orderBy: {
        blockNumber: 'desc',
      },
    });

    if (!groupMerkleTree) {
      return Response.json({ error: 'Merkle tree not found' }, { status: 400 });
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
        signInSig: Buffer.from(hexToBytes(body.siwfResponse.signature as Hex)),
        attestation: Buffer.from(proofBytes),
        treeId: groupMerkleTree.id,
      },
    });

    await addWriterToRoom({
      roomId: body.groupId, // Room ID is the group id for creddd groups
      userId: fid.toString(),
    });

    return Response.json('OK', { status: 200 });
  });
}
