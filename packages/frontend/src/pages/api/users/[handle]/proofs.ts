import prisma from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

// Get all proofs for a user
export default async function getUserProofs(req: NextApiRequest, res: NextApiResponse) {
  const handle = req.query.handle as string;

  // Specify whether to include the raw proofs in the response.
  // (Raw proofs are large so we make them optional)
  const includeProofs = req.query.includeProofs === 'true';

  const proofs = await prisma.membershipProof.findMany({
    select: {
      proof: includeProofs,
      proofHash: true,
      publicInput: true,
      merkleRoot: true,
      proofVersion: true,
    },
    where: {
      message: handle,
    },
  });

  res.json(proofs);
}
