import { getProofHash } from '@/lib/utils';
import {
  EIP721_CREDDD_PROOF_HASH_SIG_DOMAIN,
  EIP721_CREDDD_PROOF_HASH_SIG_TYPES,
  constructProofHashSigMessage,
  constructProofSigMessage,
} from '@/lib/eip712';
import { AddCredddRequestBody } from '@/types';
import { NextRequest } from 'next/server';
import {
  bytesToHex,
  getAddress,
  hashTypedData,
  hexToBytes,
  verifyTypedData,
} from 'viem';
// @ts-ignore
import * as circuit from 'circuit-node/circuits_embedded';
import { addUserCreddd } from '@/lib/backend/userCreddd';
import privy from '@/lib/backend/privy';
import credddRpcClient from '@/lib/credddRpc';
import { addWriterToRoom } from '@cred/firebase';

let circuitInitialized = false;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AddCredddRequestBody;

  const proofBytes = hexToBytes(body.proof);

  if (!circuitInitialized) {
    await circuit.prepare();
    circuitInitialized = true;
  }

  // 1. Verify the proof

  const isProofValid = await circuit.verify_membership(proofBytes);

  if (!isProofValid) {
    return Response.json({ error: 'Invalid proof' }, { status: 400 });
  }

  // 2. Verify the signature from the Privy address
  // The Privy address should have signed the proof hash
  const proofHash = getProofHash(body.proof);
  const proofAttestationMessage = constructProofHashSigMessage(proofHash);

  const isPrivySigValid = verifyTypedData({
    address: body.privyAddress,
    signature: body.privyAddressSignature,
    message: proofAttestationMessage,
    primaryType: 'ProofHash',
    domain: EIP721_CREDDD_PROOF_HASH_SIG_DOMAIN,
    types: EIP721_CREDDD_PROOF_HASH_SIG_TYPES,
  });

  if (!isPrivySigValid) {
    return Response.json({ error: 'Invalid Privy signature' }, { status: 400 });
  }

  // 4. Verify the merkle root

  const merkleRootBytes = await circuit.get_merkle_root(proofBytes);

  const merkleRoot = bytesToHex(merkleRootBytes, {
    size: 32,
  });

  const attestedAddressBytes = await circuit.get_sign_in_sig(proofBytes);
  const attestedAddress = getAddress(
    bytesToHex(attestedAddressBytes.slice(0, 20), {
      size: 20,
    })
  );

  if (attestedAddress !== body.privyAddress) {
    return Response.json(
      { error: 'The attested address does not match the Privy address' },
      { status: 400 }
    );
  }

  const group = await credddRpcClient.getGroupByMerkleRoot(merkleRoot);

  if (!group) {
    return Response.json(
      { error: 'Group not found for the Merkle root' },
      { status: 400 }
    );
  }

  // 5. Verify the signed message in the proof

  const message = constructProofSigMessage(body.privyAddress);
  const expectedMsgHash = await hashTypedData(message);

  // Get the message hash from the proof
  const msgHash = bytesToHex(await circuit.get_msg_hash(proofBytes));

  if (msgHash !== expectedMsgHash) {
    return Response.json({ error: 'Invalid message' }, { status: 400 });
  }

  const user = await privy.getUserByWalletAddress(body.privyAddress);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 400 });
  }

  await addWriterToRoom({
    roomId: group.id,
    userId: user.id,
  });

  await addUserCreddd({
    userId: user.id,
    creddd: {
      proof: body.proof as string,
      privySignature: body.privyAddressSignature,
      groupId: group.id,
    },
  });

  return new Response('OK');
}
