import prisma from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';
import { Hex } from 'viem';

export default async function getProof(req: NextApiRequest, res: NextApiResponse) {
  const proofHash = req.query.proofHash as Hex;

  // Get the proof by hash
  const fullProof = await prisma.membershipProof.findFirst({
    where: {
      proofHash,
    },
  });

  res.json(fullProof);
}
