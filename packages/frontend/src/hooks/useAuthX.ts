import { createXAuthMessage } from '@/lib/utils';
import { useState } from 'react';
import { useSignedInAddress } from './useSignedInAddress';
import { Hex } from 'viem';
import { useAccount, useSignMessage, useSignTypedData } from 'wagmi';
import axios from 'axios';
import { AuthStatus } from '@/types';

export const useAuthX = () => {
  const [signature, setSignature] = useState<Hex | null>(null);
  const { address } = useAccount();
  const { signedInAddress } = useSignedInAddress();
  const { signTypedDataAsync } = useSignTypedData();
  const [verifyingTweet, setVerifyingTweet] = useState(false);
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.Idle);

  const sign = async (username: string) => {
    if (!signedInAddress) {
      throw new Error('Not signed in');
    }

    if (address !== signedInAddress) {
      throw new Error('Wrong address connected');
    }

    const msg = createXAuthMessage(signedInAddress, username);
    try {
      // @ts-ignore
      const sig = await signTypedDataAsync(msg);
      setSignature(sig);
    } catch (err) {
      console.log(err);
    }
  };

  const submitTweetUrl = async (username: string, tweetUrl: string) => {
    setVerifyingTweet(true);
    const result = await axios.post<{ verified: boolean }>('/api/x/auth', {
      tweetUrl,
      address,
      signature,
      username,
    });

    if (result.data.verified) {
      setVerifyingTweet(false);
      setStatus(AuthStatus.Verified);
    } else {
      setVerifyingTweet(false);
      setStatus(AuthStatus.Failed);
    }
  };

  return { sign, signature, status, verifyingTweet, submitTweetUrl };
};
