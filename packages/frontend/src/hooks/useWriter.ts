import { TweetBody, NewTweetRequestBody } from '@/app/types';
import useSigner from './useSigner';
import { encodeActionBody, postJSON, toHexString } from '@/lib/utils';
import { useState } from 'react';
import { PostResponse } from '@/app/api/posts/route';
import { useUserAccount } from '@/contexts/UserAccountContext';

/**
 * Sign and submit actions to the backend.
 * (e.g. tweet)
 */
const useWriter = () => {
  const { sign } = useSigner();
  const { pubKey } = useUserAccount();
  const [submittingPost, setSubmittingPost] = useState(false);

  const post = async (tweetBody: TweetBody): Promise<PostResponse> => {
    if (pubKey) {
      setSubmittingPost(true);
      // Sign the message with the singer
      const tweetBodyBuffer = encodeActionBody(tweetBody);
      const sig = await sign(tweetBodyBuffer);

      const body: NewTweetRequestBody = {
        body: tweetBody,
        sig: toHexString(sig),
        pubKey,
      };

      const result = await postJSON({
        url: `/api/posts`,
        body,
        method: 'POST',
      });

      const response = await result.json();
      setSubmittingPost(false);

      return response;
    } else {
      throw new Error('No public key found');
    }
  };

  return { post, submittingPost };
};

export default useWriter;
