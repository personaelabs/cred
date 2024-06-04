'use client';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useIsPwa from '@/hooks/useIsPwa';
import { getMobileOperatingSystem } from '@/lib/utils';
import { MobileOS } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const IOSInstallation = () => {
  return (
    <div>
      <div className="text-lg mt-4">1. Tap the share button </div>
      <div className="text-lg">2. Tap &quot;Add to Home Screen&quot;</div>
    </div>
  );
};

const AndroidInstallation = () => {
  return (
    <div>
      <div className="text-lg mt-4">1. Tap the ... icon </div>
      <div className="text-lg">2. Tap &quot;Install app&quot;</div>
    </div>
  );
};

const InstallPwaPage = () => {
  const { setOptions } = useHeaderOptions();
  const isPwa = useIsPwa();
  const router = useRouter();
  const [mobileOS, setMobileOS] = useState<MobileOS | null>(null);

  useEffect(() => {
    setOptions({
      title: 'Install app',
      showBackButton: false,
      headerRight: <></>,
    });
  }, [setOptions]);

  useEffect(() => {
    if (isPwa) {
      router.replace('/');
    }
  }, [isPwa, router]);

  useEffect(() => {
    setMobileOS(getMobileOperatingSystem());
  }, []);

  return (
    <div className="bg-background h-full flex flex-col items-center justify-center px-4">
      <div className="text-2xl text-primary">
        Please add this app <br></br> to your home screen
      </div>
      {mobileOS === MobileOS.IOS ? (
        <IOSInstallation />
      ) : mobileOS === MobileOS.ANDROID ? (
        <AndroidInstallation />
      ) : (
        // Show IOS installation instructions for other OS
        <IOSInstallation />
      )}
    </div>
  );
};

export default InstallPwaPage;
