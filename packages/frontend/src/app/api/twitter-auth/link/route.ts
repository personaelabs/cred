import { NextRequest } from 'next/server';
import { appClient } from '@/lib/twitter';
import prisma from '@/lib/prisma';

const OAUTH_CALLBACK =
  process.env.NODE_ENV === 'production'
    ? process.env.VERCEL_URL + '/api/twitter-auth/callback'
    : 'https://personae-dev-1.ngrok.app/api/twitter-auth/callback';

/**
 * Generate and return a Twitter OAuth link
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const groupHandle = searchParams.get('group') as string;
  const publicKey = searchParams.get('publicKey') as string;

  const group = await prisma.group.findUnique({
    where: {
      handle: groupHandle,
    },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  const authLink = await appClient.generateAuthLink(`${OAUTH_CALLBACK}`);

  const signer = await prisma.signer.findUnique({
    select: {
      twitterUsername: true,
    },
    where: {
      publicKey,
    },
  });

  if (signer?.twitterUsername) {
    return Response.json(
      {
        error: 'Twitter account already linked',
      },
      {
        status: 400,
      }
    );
  }

  if (!signer) {
    // Create the signer if it doesn't exist
    await prisma.signer.create({
      data: {
        publicKey,
      },
    });
  }

  await prisma.oAuth.create({
    data: {
      publicKey,
      groupId: group.id,
      oAuthToken: authLink.oauth_token,
      oAuthSecret: authLink.oauth_token_secret,
    },
  });

  return Response.json({
    url: authLink.url,
  });
}
