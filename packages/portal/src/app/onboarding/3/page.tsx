/* eslint-disable @next/next/no-img-element */
'use client';
import OnboardingChatBubble from '@/components/OnboardingChatBubble';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { useSignInMethod } from '@/contexts/SignInMethodContext';
import useSignIn from '@/hooks/useSignIn';
import Link from 'next/link';
import { useEffect } from 'react';

const onboardingMessages = [
  {
    text: 'first, you must choose your name. how should others see you?',
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

  const { mutateAsync: signIn } = useSignIn({
    redirectToAddRep: false,
  });

  const { setSignInMethod } = useSignInMethod();

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
          className="w-[140px]"
        >
          <img
            src="/fc-logo.svg"
            alt="farcaster logo"
            className="h-6 w-6 mr-2"
          ></img>
          Farcaster
        </Button>
        <Button
          variant="outline"
          className="w-[140px]"
          onClick={() => {
            setSignInMethod('twitter');
            signIn();
          }}
        >
          <img
            src="/x-logo.svg"
            alt="farcaster logo"
            className="h-5 w-5 mr-2"
          ></img>
          Twitter
        </Button>
        <Link href="/onboarding/login-anon">
          <Button variant="outline" className="w-[140px]">
            Continue as anon
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default OnboardingStep3;
