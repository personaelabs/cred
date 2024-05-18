'use client';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { useEffect } from 'react';
import { CirclePlus } from 'lucide-react';
import theme from '@/lib/theme';
import { copyTextToClipboard, trimAddress } from '@/lib/utils';
import { Hex, formatEther } from 'viem';
import { toast } from 'sonner';
import { useAccount, useBalance } from 'wagmi';

const WalletPage = () => {
  const { setOptions } = useHeaderOptions();
  // const { wallets } = useWallets();
  const { address } = useAccount();
  const { data } = useBalance({
    address,
  });

  useEffect(() => {
    setOptions({
      title: 'Wallet',
      showBackButton: true,
    });
  }, [setOptions]);

  return (
    <div className="flex flex-col items-center h-full">
      <div className="text-4xl mt-8">
        {data?.value ? formatEther(data?.value) : ''} ETH
      </div>
      <div className="flex text-lg flex-row gap-x-2 items-center mt-8">
        {address ? trimAddress(address as Hex) : ''}
      </div>
      <div
        className="flex flex-row gap-x-2 items-center mt-[100px]"
        onClick={async () => {
          copyTextToClipboard(address as string);
          toast.info(`Copied address ${trimAddress(address as Hex)}`);
        }}
      >
        <CirclePlus className="w-7 h-7" color={theme.orange}></CirclePlus>
        <div className="text-lg">Deposit on Base</div>
      </div>
    </div>
  );
};

export default WalletPage;
