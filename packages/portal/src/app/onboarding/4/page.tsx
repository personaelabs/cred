'use client';
import OnboardingChatBubble from '@/components/OnboardingChatBubble';
import { Button } from '@/components/ui/button';

const onboardingMessages = [
  {
    text: 'ppportals are ephemeral windows into the minds of insiders',
  },
  {
    text: "they open for a few hours at a time once they close, they're gone foreverI can help you with onboarding.",
  },
  {
    text: 'pay a fee, see inside',
  },
  {
    text: 'are you an insider? add your rep, contribute -> get paid',
  },
];

const OnboardingStep4 = () => {
  return (
    <div className="flex flex-col h-[62%] justify-between">
      <div className="flex flex-col gap-y-4 p-4">
        {onboardingMessages.map((message, index) => (
          <OnboardingChatBubble
            key={index}
            text={message.text}
          ></OnboardingChatBubble>
        ))}
      </div>
      <div className="flex flex-row items-center justify-center">
        <Button>Next</Button>
      </div>
    </div>
  );
};

export default OnboardingStep4;
