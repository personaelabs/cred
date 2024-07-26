/* eslint-disable @next/next/no-img-element */
'use client';
import OnboardingChatBubble from '@/components/OnboardingChatBubble';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { useSignInMethod } from '@/contexts/SignInMethodContext';
import useSignIn from '@/hooks/useSignIn';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

const onboardingMessages = [
  {
    text: 'first, you must choose your name\nhow should others see you?',
  },
  {
    text: `choosing Twitter or Farcaster will automatically bridge any rep you have there`,
  },
];

const OnboardingStep3 = () => {
  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    setOptions({
      title: '',
      showBackButton: true,
      backTo: '/onboarding/2',
    });
  }, [setOptions]);

  const { mutateAsync: signIn, isSigningIn } = useSignIn({
    redirectToAddRep: false,
  });

  const { setSignInMethod, signInMethod } = useSignInMethod();

  const isSigningInWithFc = signInMethod === 'farcaster' && isSigningIn;
  const isSigningInWithTwitter = signInMethod === 'twitter' && isSigningIn;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-y-4 p-4">
        {onboardingMessages.map((message, index) => (
          <OnboardingChatBubble
            key={index}
            text={message.text}
          ></OnboardingChatBubble>
        ))}
      </div>
      <div className="flex flex-col gap-y-2 items-center justify-center mt-8">
        <div className="opacity-60">Import name from</div>
        <Button
          variant="outline"
          onClick={() => {
            setSignInMethod('farcaster');
            signIn();
          }}
          className="w-[160px]"
          disabled={isSigningIn}
        >
          {isSigningInWithFc && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin"></Loader2>
          )}
          <img
            src="/fc-logo.svg"
            alt="farcaster logo"
            className="h-6 w-6 mr-2"
          ></img>
          Farcaster
        </Button>
        <Button
          variant="outline"
          className="w-[160px]"
          onClick={() => {
            setSignInMethod('twitter');
            signIn();
          }}
          disabled={isSigningIn}
        >
          {isSigningInWithTwitter && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin"></Loader2>
          )}
          <img
            src="/x-logo.svg"
            alt="farcaster logo"
            className="h-5 w-5 mr-2"
          ></img>
          Twitter
        </Button>
        <Link href="/onboarding/login-anon">
          <Button
            variant="outline"
            className="w-[160px]"
            disabled={isSigningIn}
          >
            Continue as anon
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default OnboardingStep3;
