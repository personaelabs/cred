import { NextApiRequest, NextApiResponse } from 'next';
import { FcProfile } from '@/types';
import { getFcProfile } from '@/lib/fc';

// Get all proofs for a user
export default async function getFcUser(req: NextApiRequest, res: NextApiResponse<FcProfile>) {
  const fid = req.query.fid as string;

  // Fetch user profile from airstack
  const profile = await getFcProfile(fid);

  res.send(profile);
}
