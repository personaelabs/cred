'use client';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { useEffect } from 'react';
import { CirclePlus } from 'lucide-react';
import theme from '@/lib/theme';
import {
  copyTextToClipboard,
  formatEthBalance,
  trimAddress,
} from '@/lib/utils';
import { Hex } from 'viem';
import { toast } from 'sonner';
import { useAccount, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { usePrivy } from '@privy-io/react-auth';

const WalletPage = () => {
  const { setOptions } = useHeaderOptions();
  // const { wallets } = useWallets();
  const { address } = useAccount();
  const { data } = useBalance({
    address,
  });
  const { exportWallet } = usePrivy();

  useEffect(() => {
    setOptions({
      title: 'Wallet',
      showBackButton: true,
    });
  }, [setOptions]);

  return (
    <div className="flex flex-col items-center h-full">
      <div className="text-4xl mt-8">
        {data?.value !== undefined ? formatEthBalance(data?.value) : ''} ETH
      </div>
      <div className="flex text-lg flex-row gap-x-2 items-center mt-8">
        {address ? trimAddress(address as Hex) : ''}
      </div>
      <div className="flex flex-col justify-between items-center h-full pb-[40px]">
        <div
          className="flex flex-row gap-x-2 items-center mt-[50px]"
          onClick={async () => {
            copyTextToClipboard(address as string);
            toast.info(`Copied address ${trimAddress(address as Hex)}`);
          }}
        >
          <CirclePlus className="w-7 h-7" color={theme.orange}></CirclePlus>
          <div className="text-lg">Deposit on Base</div>
        </div>
        <div className="mt-[50px]">
          <Button onClick={exportWallet} variant="link">
            Export wallet
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
