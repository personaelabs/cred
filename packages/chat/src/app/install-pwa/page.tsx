'use client';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { useEffect } from 'react';

const InstallPwaPage = () => {
  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    setOptions({
      title: 'Install app',
      showBackButton: false,
      headerRight: <></>,
    });
  }, [setOptions]);

  return (
    <div className="bg-background h-full flex flex-col items-center justify-center px-4">
      <div className="text-2xl text-primary">
        Please add this app <br></br> to your home screen
      </div>
      <div className="text-lg mt-4">1. Tap the share button </div>
      <div className="text-lg">2. Tap &quot;Add to Home Screen&quot;</div>
    </div>
  );
};

export default InstallPwaPage;
