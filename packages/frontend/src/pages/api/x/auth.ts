import { createXAuthMessage, createXVerificationTweetMessage } from '@/lib/utils';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'twitter-api-sdk';
import { verifyMessage } from 'viem';

const client = new Client(process.env.TWITTER_BEARER_TOKEN as string);

export default async function submitProof(req: NextApiRequest, res: NextApiResponse) {
  const { tweetUrl, address, username, signature } = req.body;

  if (!tweetUrl) {
    res.status(400).send({ error: 'Missing tweetUrl' });
    return;
  }

  const tweetId = tweetUrl.split('/').pop();

  // Get the tweet from the X API
  const tweet = await client.tweets.findTweetById(tweetId, {
    'tweet.fields': ['author_id'],
  });

  if (!tweet.data) {
    console.log(`Can't find tweet ${tweetId}`);
    res.status(400).send({ error: `Can't find tweet ${tweetId}` });
    return;
  }

  // Get the username of author from the X API
  const user = await client.users.findUserById(tweet.data!.author_id!, {
    'user.fields': ['username'],
  });

  // Verify that the tweet text matches the expected text
  const expectedText = createXVerificationTweetMessage(address, username, signature);
  if (expectedText !== tweet.data.text) {
    console.log('Invalid tweet');
    res.status(400).send({ error: 'Invalid tweet' });
    return;
  }

  // Check that the username matches the expected username
  if (user.data!.username !== username) {
    const message = `Invalid username. Expected ${username} got ${user.data!.username}`;
    console.log(message);
    res.status(400).send({ error: message });
    return;
  }

  // Verify the signature
  const verified = await verifyMessage({
    address,
    // @ts-ignore
    message: createXAuthMessage(address, username),
    signature,
  });

  if (!verified) {
    console.log('Invalid signature');
    res.status(400).send({ error: 'Invalid signature' });
    return;
  }

  // Save the username and the address to the database

  res.status(200).send({
    verified: true,
  });
}
