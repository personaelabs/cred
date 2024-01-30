import { NextRequest } from 'next/server';
import { appClient } from '@/lib/twitter';
import prisma from '@/lib/prisma';

const OAUTH_CALLBACK =
  process.env.NODE_ENV === 'production'
    ? process.env.VERCEL_URL + '/api/twitter-auth/callback'
    : 'https://personae-dev.ngrok.app/api/twitter-auth/callback';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const groupHandle = searchParams.get('group') as string;

  const group = await prisma.group.findUnique({
    where: {
      handle: groupHandle,
    },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  const authLink = await appClient.generateAuthLink(`${OAUTH_CALLBACK}`);

  await prisma.oAuth.create({
    data: {
      groupId: group.id,
      oAuthToken: authLink.oauth_token,
      oAuthSecret: authLink.oauth_token_secret,
    },
  });

  return Response.json({
    url: authLink.url,
  });
}
