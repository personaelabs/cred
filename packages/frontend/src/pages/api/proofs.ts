// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { Hex, hashMessage, keccak256 } from 'viem';
import prisma from '@/lib/prisma';
import { CircuitV3 } from '../../lib/circuit/circuit_v3';

import { ROOT_TO_SET } from '@/lib/sets';
import { toPrefixedHex } from '@/lib/utils';

let verifiedInitialized = false;

// Merkle roots copied from json files
const VALID_ROOTS: Hex[] = Object.keys(ROOT_TO_SET).map((root) =>
  toPrefixedHex(BigInt(root).toString(16)),
);

export default async function submitProof(req: NextApiRequest, res: NextApiResponse) {
  const proof: Hex = req.body.proof;
  console.log('Proof', proof.length);

  // The signed message
  const message: string = req.body.message;

  if (!verifiedInitialized) {
    // Initialize the verifier's wasm
    await CircuitV3.prepare();
    verifiedInitialized = true;
  }

  // Verify the proof
  console.time('verify');
  const verified = await CircuitV3.verify(proof);
  console.timeEnd('verify');
  if (!verified) {
    res.status(400).send({ error: 'Invalid proof' });
    return;
  }

  const merkleRoot = CircuitV3.getMerkleRoot(proof);
  // Check if the merkle root is valid
  if (!VALID_ROOTS.includes(merkleRoot)) {
    res.status(400).send({ error: 'Invalid merkle root' });
    return;
  }

  const msgHash = CircuitV3.getMsgHash(proof);
  // Check if the message hash is valid
  if (msgHash !== hashMessage(message)) {
    res.status(400).send({ error: 'Invalid message hash' });
    return;
  }

  // Compute the proof hash
  let proofHash: Hex = keccak256(proof);

  // Save the proof to the database. We save the proof the public input in hex format.
  await prisma.membershipProof.create({
    data: {
      message,
      proof,
      merkleRoot,
      publicInput: '',
      proofHash,
      proofVersion: 'v3', // We expect the submitted proof to be a V2 proof
    },
  });

  res.send({ proofHash });
}
