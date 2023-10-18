import { getFcProfile } from '@/lib/fc';
import prisma from '@/lib/prisma';
import { FcAnon } from '@/types';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function getUserProofs(req: NextApiRequest, res: NextApiResponse<FcAnon>) {
  const fid = parseInt(req.query.fid as string);

  const proofs = await prisma.membershipProof.findMany({
    where: {
      fid,
    },
  });

  // Fetch user profile from Airstack
  const profile = await getFcProfile(fid.toString());

  const fcAnon: FcAnon = {
    profile,
    proofs,
  };

  res.json(fcAnon);
}
