/* eslint-disable @next/next/no-img-element */
'use client';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { useEffect, useState } from 'react';
import { ArrowDownToLine, CircleFadingPlus } from 'lucide-react';
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
import Scrollable from '@/components/Scrollable';
import WithdrawalSheet from '@/components/bottom-sheets/WithdrawalSheet';
import ClickableBox from '@/components/ClickableBox';
import firebaseProd from '@/lib/firebase/firebase.prod';

const DepositButton = (props: { address: Hex | undefined }) => {
  const { address } = props;

  return (
    <ClickableBox
      className="flex flex-row gap-x-2 items-center mt-[50px]"
      onClick={async () => {
        copyTextToClipboard(address as string);
        toast.info(`Copied address ${trimAddress(address as Hex)}`);
      }}
    >
      <CircleFadingPlus className="w-4 h-4 text-primary"></CircleFadingPlus>
      <div className="text-md flex flex-row items-center">
        Deposit on{' '}
        <img src="/base.png" alt="base" className="w-4 h-4 mx-1"></img>
        {process.env.NEXT_PUBLIC_PROJECT_ID === firebaseProd.projectId
          ? 'Base'
          : 'Base Sepolia'}
      </div>
    </ClickableBox>
  );
};

interface WithdrawalButtonProps {
  onClick: () => void;
}

const WithdrawalButton = (props: WithdrawalButtonProps) => {
  const { onClick } = props;

  return (
    <ClickableBox
      className="flex flex-row gap-x-2 items-center mt-[20px]"
      onClick={onClick}
    >
      <ArrowDownToLine
        className="mr-2 w-4 h-4"
        color={theme.orange}
      ></ArrowDownToLine>
      <div className="text-md">Withdrawal</div>
    </ClickableBox>
  );
};

const WalletPage = () => {
  const { setOptions } = useHeaderOptions();
  const { address } = useAccount();
  const { data } = useBalance({
    address,
  });
  const { exportWallet } = usePrivy();
  const [isWithdrawalSheetOpen, setIsWithdrawalSheetOpen] = useState(false);

  useEffect(() => {
    setOptions({
      title: 'Wallet',
      showBackButton: true,
    });
  }, [setOptions]);

  return (
    <>
      <Scrollable>
        <div className="flex flex-col items-center">
          <div className="text-4xl mt-8">
            {data?.value !== undefined ? formatEthBalance(data?.value) : ''} ETH
          </div>
          <div className="flex text-lg flex-row gap-x-2 items-center mt-8">
            {address ? trimAddress(address as Hex) : ''}
          </div>
          <div className="flex flex-col justify-between items-center h-full  pb-[40px] overflow-auto">
            <DepositButton address={address}></DepositButton>
            <WithdrawalButton
              onClick={() => {
                setIsWithdrawalSheetOpen(true);
              }}
            ></WithdrawalButton>
            <div className="mt-[50px]">
              <Button onClick={exportWallet} variant="link">
                Export wallet
              </Button>
            </div>
          </div>
        </div>
      </Scrollable>
      <WithdrawalSheet
        onClose={() => {
          setIsWithdrawalSheetOpen(false);
        }}
        onSuccess={() => {
          setIsWithdrawalSheetOpen(false);
        }}
        isOpen={isWithdrawalSheetOpen}
      ></WithdrawalSheet>
    </>
  );
};

export default WalletPage;
