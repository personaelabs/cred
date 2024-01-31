import { PostBody, PostRequestBody } from '@/app/types';
import useSigner from './useSigner';
import { encodeActionBody, postJSON, toHexString } from '@/lib/utils';
import { useState } from 'react';
import { PostResponse } from '@/app/api/posts/route';
import { useUserAccount } from '@/contexts/UserAccountContext';

// Post a new post to the backend.
const useWriter = () => {
  const { sign } = useSigner();
  const { pubKey, signer } = useUserAccount();
  const [submittingPost, setSubmittingPost] = useState(false);

  const post = async (postBody: PostBody): Promise<PostResponse> => {
    if (pubKey) {
      if (!signer?.TwitterUser?.username) {
        throw new Error('No Twitter account found for signer');
      }

      setSubmittingPost(true);
      // Sign the message with the singer
      const postBodyBuffer = encodeActionBody(postBody);
      const sig = await sign(postBodyBuffer);

      const body: PostRequestBody = {
        username: signer.TwitterUser.username,
        body: postBody,
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
