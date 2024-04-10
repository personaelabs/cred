/* eslint-disable @next/next/no-img-element */
'use client';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import { useConnectedAccounts } from '@/context/ConnectWalletContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ReskinConnectWalletPage() {
  const { isConnected } = useConnectedAccounts();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push('/reskin/setup');
    }
  }, [isConnected, router]);

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] px-4 gap-y-10">
      <div>
        <div className="text-lg">reskin</div>
      </div>
      <div>
        <ConnectWalletButton label="Connect your wallets to reskin"></ConnectWalletButton>
      </div>
    </div>
  );
}
