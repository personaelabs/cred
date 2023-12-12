import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { useAuthX } from '@/hooks/useAuthX';
import { useSignedInAddress } from '@/hooks/useSignedInAddress';
import { createXVerificationTweetMessage, trimAddress } from '@/lib/utils';
import { AuthStatus } from '@/types';
import { Loader2, TwitterIcon, XIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Hex } from 'viem';
import { useAccount } from 'wagmi';

const SettingsPage = () => {
  const { signedInAddress } = useSignedInAddress();
  const [username, setUsername] = useState<string>('');
  const [tweetUrl, setTweetUrl] = useState<string>('');
  const authX = useAuthX();
  const { address } = useAccount();

  useEffect(() => {
    if (authX.status === AuthStatus.Verified) {
      toast({
        title: 'Verification successful',
      });
    }
  }, [authX.status]);

  return (
    <div className="flex flex-col items-center">
      <h1 className="mt-4 text-2xl font-semibold">Settings</h1>
      <div className="mt-8 flex w-full justify-start">
        <span>Connect X Account</span>
      </div>
      <div className="mt-4 flex w-full max-w-sm items-center space-x-2">
        <span className="mr-0.1">@</span>
        <Input
          placeholder="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
          }}
        ></Input>
        <Button
          disabled={username === ''}
          onClick={() => {
            console.log({ address, signedInAddress });
            if (address?.toLowerCase() !== signedInAddress?.toLowerCase()) {
              toast({
                title: `Please connect with ${trimAddress(signedInAddress as Hex)}`,
                variant: 'destructive',
              });
            } else {
              authX.sign(username);
            }
          }}
        >
          <Image src={'/x-logo.svg'} width={12} height={12} alt="X logo" className="mr-2"></Image>
          Connect
        </Button>
      </div>
      {authX.signature ? (
        <>
          <Button className="mt-4" asChild>
            <Link
              href={`https://x.com/intent/tweet?text=${createXVerificationTweetMessage(
                address as Hex,
                username,
                authX.signature,
              )}`}
              target="_blank"
            >
              Post verification tweet
            </Link>
          </Button>
          <div className="mt-4 flex w-full max-w-sm items-center space-x-2">
            <Input
              value={tweetUrl}
              onChange={(e) => {
                setTweetUrl(e.target.value);
              }}
              placeholder="Tweet url"
            ></Input>
            <Button
              disabled={tweetUrl === '' || authX.verifyingTweet}
              onClick={() => {
                if (tweetUrl) {
                  authX.submitTweetUrl(username, tweetUrl);
                }
                // Submit twitter url
              }}
            >
              {authX.verifyingTweet ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"></Loader2>
                  Verifying
                </>
              ) : (
                <>Verify</>
              )}
            </Button>
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default SettingsPage;
