/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import Link from 'next/link';
import { useEffect } from 'react';

const OnboardingStep1 = () => {
  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    setOptions({
      title: 'ppportals',
      showBackButton: false,
    });
  }, [setOptions]);

  return (
    <div className="flex flex-col gap-y-4 px-2 h-[62%] items-center justify-center">
      <img
        src="/personae-logo.svg"
        alt="personae logo"
        className="mt-4 w-[62px] h-[62px]"
      ></img>
      <div className="mt-8 flex flex-col gap-y-2 items-center justify-center">
        <Link href="/onboarding/2">
          <Button className="w-[142px]">Create account</Button>
        </Link>
        <Link href="/signin">
          <Button className="w-[142px]">Sign in</Button>
        </Link>
      </div>
    </div>
  );
};

export default OnboardingStep1;
