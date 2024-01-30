import { NextRequest } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

const { API_KEY, API_KEY_SECRET } = process.env;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  // Get the OAuth token and verifier from the query string.
  const oauthToken = searchParams.get('oauth_token') as string;
  const oauthVerifier = searchParams.get('oauth_verifier') as string;

  // Get the OAuth secret from the database.
  const oAuth = await prisma.oAuth.findUnique({
    select: {
      oAuthToken: true,
      oAuthSecret: true,
      Group: {
        select: {
          handle: true,
        },
      },
    },
    where: {
      oAuthToken: oauthToken,
    },
  });

  if (!oAuth) {
    throw new Error('oAuth not found');
  }

  // Create a new Twitter client using the OAuth token and secret.
  const client = new TwitterApi({
    appKey: API_KEY as string,
    appSecret: API_KEY_SECRET as string,
    accessToken: oAuth.oAuthToken,
    accessSecret: oAuth.oAuthSecret,
  });

  // Convert the oauth verifier into an access token.
  const result = await client.login(oauthVerifier);
  const accessToken = result.accessToken;
  const accessSecret = result.accessSecret;

  const user = await prisma.user.findUnique({
    where: {
      username: result.screenName,
    },
  });

  if (!user) {
    // Save the access token and access token secret to the database.
    await prisma.user.create({
      data: {
        username: result.screenName,
        accessToken,
        accessTokenSecret: accessSecret,
      },
    });
  }

  redirect(
    `/groups/${oAuth.Group.handle}/verify?username=${result.screenName}`
  );
}
