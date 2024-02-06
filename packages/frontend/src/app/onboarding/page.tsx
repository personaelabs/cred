'use client';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

const OnboardingPage = () => {
  const { isConnected, isConnecting } = useAccount();
  const { openConnectModal } = useConnectModal();

  // TODO: Redirect if wallet is connected


  return (
    <div>
      <div className="flex flex-col justify-center items-center h-[80vh] gap-10">
        {isConnected || isConnecting ? (
          <></>
        ) : (
          <>
            <p className="text-[26px]">Welcome!</p>
            <p className="opacity-80 text-[16px]">
              Connect your wallet to start
            </p>
            <Button
              disabled={isConnected || isConnected}
              onClick={() => {
                if (openConnectModal) {
                  openConnectModal();
                }
              }}
            >
              {isConnected ? <Check className="mr-2 w-4 h-4"></Check> : <></>}
              Connect wallet
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
