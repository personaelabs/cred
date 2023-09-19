// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { Hex, keccak256 } from 'viem';
import prisma from '@/lib/prisma';

const concatHex = (hex1: Hex, hex2: Hex): Hex => {
  return `0x${hex1.replace('0x', '')}${hex2.replace('0x', '')}`;
};

export default async function submitProof(req: NextApiRequest, res: NextApiResponse) {
  const proof: Hex = req.body.proof;
  const publicInput: Hex = req.body.publicInput;

  // Convert submitted proof from hex to bytes
  const proofBytes = Buffer.from(proof.replace('0x', ''), 'hex');
  const publicInputBytes = Buffer.from(publicInput.replace('0x', ''), 'hex');

  // TODO: Verify the proof

  // Compute the proof hash
  let proofHash: Hex = keccak256(concatHex(proof, publicInput));

  // Save the proof to the database. We save the proof the public input in hex format.
  await prisma.membershipProof.create({
    data: {
      proof,
      publicInput,
      proofHash,
    },
  });
}
