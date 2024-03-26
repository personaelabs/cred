export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import neynar from '@/lib/neynar';
import { NeynarUserResponse } from '@/app/types';
import prisma from '@/lib/prisma';

const leaderBoardData = [
  {
    fid: 54,
    score: 16761,
  },
  {
    fid: 1068,
    score: 16780,
  },
  {
    fid: 1894,
    score: 17033,
  },
  {
    fid: 2282,
    score: 17045,
  },
  {
    fid: 2416,
    score: 54178,
  },
  {
    fid: 2616,
    score: 8971,
  },
  {
    fid: 7143,
    score: 1270,
  },
  {
    fid: 11499,
    score: 17531,
  },
  {
    fid: 262391,
    score: 3708,
  },
  {
    fid: 320985,
    score: 35044,
  },
];

export async function GET(_req: NextRequest) {
  const fids = leaderBoardData.map(record => record.fid);

  // Get attestations of users in the leaderboard from the database
  const fidAttestations = await prisma.fidAttestation.findMany({
    select: {
      fid: true,
      MerkleTree: {
        select: {
          Group: {
            select: {
              displayName: true,
            },
          },
        },
      },
    },
    where: {
      fid: {
        in: fids,
      },
    },
  });

  const usersCreddd = new Map<number, string[]>();

  // Get user creddd from attestations
  fidAttestations.forEach(attestation => {
    const userCreddd = usersCreddd.get(attestation.fid) || [];
    userCreddd.push(attestation.MerkleTree.Group.displayName);
    usersCreddd.set(attestation.fid, userCreddd);
  });

  // Get user data from Neynar
  const userData = await neynar.get<{ users: NeynarUserResponse[] }>(
    `/user/bulk?fids=${fids.join(',')}`
  );

  const leaderBoardWithUserData = leaderBoardData
    .map(record => {
      const user = userData.data.users.find(u => u.fid === record.fid);
      const creddd = usersCreddd.get(record.fid) || [];
      return {
        fid: record.fid,
        user,
        creddd,
        score: record.score,
      };
    })
    // Sort by score
    .sort((a, b) => b.score - a.score);

  // Return user data and attestations
  return Response.json(leaderBoardWithUserData);
}
