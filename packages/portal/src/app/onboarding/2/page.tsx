'use client';
import OnboardingChatBubble from '@/components/OnboardingChatBubble';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import Link from 'next/link';
import { useEffect } from 'react';

const onboardingMessages = [
  {
    text: 'ppportals are ephemeral windows into the minds of insiders',
  },
  {
    text: "they open for a few hours at a time \nonce they close, they're gone forever",
  },
  {
    text: 'pay a fee, see inside',
  },
  {
    text: 'are you an insider? add your rep, contribute → get paid',
  },
];

const OnboardingStep2 = () => {
  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    setOptions({
      title: '',
      showBackButton: true,
      backTo: '/onboarding/1',
    });
  }, [setOptions]);

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
      <div className="mt-8 flex flex-row items-center justify-center">
        <Link href="/onboarding/3">
          <Button variant="secondary">Next</Button>
        </Link>
      </div>
    </div>
  );
};

export default OnboardingStep2;
