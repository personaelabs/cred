import { ActionType, PostRequestBody } from '@/app/types';
import prisma from '@/lib/prisma';
import { getUserClient, personaeClient } from '@/lib/twitter';
import { getTweetIdFromUrl, verifySignedAction } from '@/lib/utils';
import type { NextRequest } from 'next/server';

export interface PostResponse {
  tweetId: string;
  username: string;
}

// Create a new tweet
export async function POST(request: NextRequest) {
  const body = (await request.json()) as PostRequestBody;
  const username = body.username;

  // Check if signed the action is actually a post action
  if (body.body.action !== ActionType.Post) {
    return Response.json(
      {
        error: 'Invalid action',
      },
      {
        status: 400,
      }
    );
  }

  const verified = await verifySignedAction(body);

  if (!verified) {
    return Response.json(
      {
        error: 'Signature not verified',
      },
      {
        status: 401,
      }
    );
  }

  const signer = await prisma.signer.findUnique({
    select: {
      TwitterUser: {
        select: {
          username: true,
          accessToken: true,
          accessTokenSecret: true,
        },
      },
      attestations: {
        select: {
          merkleRoot: true,
        },
      },
    },
    where: {
      publicKey: body.pubKey,
    },
  });

  if (!signer) {
    return Response.json(
      {
        error: 'Signer not found',
      },
      {
        status: 404,
      }
    );
  }

  if (signer.attestations.length === 0) {
    return Response.json(
      {
        error: 'Signer has no attestations',
      },
      {
        status: 400,
      }
    );
  }

  const user = signer.TwitterUser;

  if (!user) {
    return Response.json(
      {
        error: 'Signer has no Twitter account',
      },
      {
        status: 400,
      }
    );
  }

  // Get a Twitter client for the space
  const userClient = getUserClient(user.accessToken, user.accessTokenSecret);

  const { text, replyTo } = body.body;

  // TODO Attach the image of the creddd to teh Tweet

  let result;
  if (replyTo) {
    // Is a reply

    // Get the tweet id to reply to from the url
    const replyToId = getTweetIdFromUrl(replyTo);

    if (!replyToId) {
      return Response.json(
        {
          error: `Invalid tweet url`,
        },
        {
          status: 400,
        }
      );
    }

    result = await userClient.v2.tweet(text, {
      reply: {
        in_reply_to_tweet_id: replyToId,
      },
    });
  } else {
    result = await userClient.v2.tweet(text);
  }

  // Reply to the tweet from the Personae account
  await personaeClient.v2.tweet(`Verified https://link-to-proof/`, {
    reply: {
      in_reply_to_tweet_id: result.data.id,
    },
  });

  return Response.json(
    {
      tweetId: result.data.id,
      username,
    },
    {
      status: 200,
    }
  );
}
