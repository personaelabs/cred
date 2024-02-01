import { NextRequest } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

const { API_KEY, API_KEY_SECRET } = process.env;

/**
 * Handle the callback from Twitter after the user has authorized the app.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  // Get the OAuth token and verifier from the query string.
  const oauthToken = searchParams.get('oauth_token') as string;
  const oauthVerifier = searchParams.get('oauth_verifier') as string;

  // Get the OAuth secret from the database.
  const oAuth = await prisma.oAuth.findUnique({
    select: {
      publicKey: true,
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
    throw new Error('oAuth session not found');
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

  const signer = await prisma.signer.findUnique({
    select: {
      twitterUsername: true,
    },
    where: {
      publicKey: oAuth.publicKey,
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

  const user = await prisma.twitterUser.findUnique({
    where: {
      username: result.screenName,
    },
  });

  if (!user) {
    // Save the access token and access token secret to the database.
    await prisma.twitterUser.create({
      data: {
        username: result.screenName,
        accessToken,
        accessTokenSecret: accessSecret,
      },
    });

    // Connect the singer to the twitter user,
    // so the signer can tweet as the twitter user.
    await prisma.signer.update({
      where: {
        publicKey: oAuth.publicKey,
      },
      data: {
        twitterUsername: result.screenName,
      },
    });
  }

  redirect(
    `/groups/${oAuth.Group.handle}/verify?username=${result.screenName}`
  );
}
