'use client';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useIsPwa from '@/hooks/useIsPwa';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const AboutPage = () => {
  const { setOptions } = useHeaderOptions();
  const isPwa = useIsPwa();
  const router = useRouter();

  useEffect(() => {
    setOptions({
      title: 'ppportals',
      showBackButton: false,
      headerRight: <></>,
    });
  }, [setOptions]);

  useEffect(() => {
    if (isPwa) {
      router.replace('/');
    }
  }, [isPwa, router]);

  return (
    <div className="bg-background h-full flex flex-col items-center justify-center px-12 gap-y-8">
      <Image
        src="/personae-logo.svg"
        width={62}
        height={62}
        alt="personae-logo"
        className="opacity-60"
      ></Image>
      <div className="text-2xl text-center">
        ppportals is a place to check in on what insiders think about goings-on
        in crypto
      </div>
      <Link href="/install-pwa">
        <Button>Get started</Button>
      </Link>
    </div>
  );
};

export default AboutPage;
