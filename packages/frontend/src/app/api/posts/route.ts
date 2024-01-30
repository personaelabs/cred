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

  const verification = await prisma.verification.findUnique({
    select: {
      User: {
        select: {
          accessToken: true,
          accessTokenSecret: true,
        },
      },
    },
    where: {
      username_publicKey: {
        username,
        publicKey: body.pubKey,
      },
    },
  });

  if (!verification) {
    return Response.json(
      {
        error: 'User and public key not verified',
      },
      {
        status: 404,
      }
    );
  }

  const user = verification.User;

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
