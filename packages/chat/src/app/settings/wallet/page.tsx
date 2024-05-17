'use client';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { useWallets } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { CirclePlus } from 'lucide-react';
import theme from '@/lib/theme';
import { copyTextToClipboard, trimAddress } from '@/lib/utils';
import { Hex } from 'viem';
import { toast } from 'sonner';

const WalletPage = () => {
  const { setOptions } = useHeaderOptions();
  const { wallets } = useWallets();

  const privyWallet = wallets.find(
    wallet => wallet.walletClientType === 'privy'
  );
  const balance = 0; // useBalance(privyWallet?.address);

  useEffect(() => {
    setOptions({
      title: 'Wallet',
      showBackButton: true,
    });
  }, [setOptions]);

  const privyAddress = privyWallet?.address;

  return (
    <div className="flex flex-col items-center h-full">
      <div className="text-4xl mt-8">{balance} ETH</div>
      <div className="flex text-lg flex-row gap-x-2 items-center mt-8">
        {privyAddress ? trimAddress(privyAddress as Hex) : ''}
      </div>
      <div
        className="flex flex-row gap-x-2 items-center mt-[100px]"
        onClick={async () => {
          copyTextToClipboard(privyAddress as string);
          toast.info(`Copied address ${trimAddress(privyAddress as Hex)}`);
        }}
      >
        <CirclePlus className="w-7 h-7" color={theme.orange}></CirclePlus>
        <div className="text-lg">Deposit on Base</div>
      </div>
    </div>
  );
};

export default WalletPage;
