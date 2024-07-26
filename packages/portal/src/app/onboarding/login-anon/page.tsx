'use client';
import OnboardingChatBubble from '@/components/OnboardingChatBubble';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { useSignInMethod } from '@/contexts/SignInMethodContext';
import useSignIn from '@/hooks/useSignIn';
import { useEffect } from 'react';

const onboardingMessages = [
  {
    text: "we'll keep your e-mail private and won't send any spam we only use it for login",
  },
];

const OnboardingLoginAnon = () => {
  const { setOptions } = useHeaderOptions();
  const { mutateAsync: signIn } = useSignIn({
    redirectToAddRep: false,
  });
  const { setSignInMethod } = useSignInMethod();

  useEffect(() => {
    setOptions({
      title: 'Sign in as anon',
      showBackButton: true,
      backTo: '/onboarding/2',
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
        <Button
          onClick={() => {
            setSignInMethod('email');
            signIn();
          }}
        >
          Continue with email
        </Button>
      </div>
    </div>
  );
};

export default OnboardingLoginAnon;
