/* eslint-disable @next/next/no-img-element */
'use client';
import { useCallback, useState } from 'react';
import { Input } from './ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Hex, parseEther } from 'viem';
import { Button } from './ui/button';
import useWithdrawal from '@/hooks/useWithdrawal';
import { Loader2 } from 'lucide-react';
import theme from '@/lib/theme';
import { useAccount, useBalance } from 'wagmi';
import { formatEthBalance } from '@/lib/utils';

interface WithdrawalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

const ProcessingSheetBody = () => {
  return (
    <>
      <SheetHeader>
        <SheetTitle>Processing withdrawal</SheetTitle>
      </SheetHeader>
      <div className="flex flex-col items-center justify-center h-[80%]">
        <Loader2
          color={theme.orange}
          className="w-[61%] h-[61%] animate-spin"
          strokeWidth={0.61}
        ></Loader2>
      </div>
    </>
  );
};

const WithdrawalSheet = (props: WithdrawalProps) => {
  const { isOpen, onSuccess, onClose } = props;
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState<bigint | undefined>(undefined);
  const { mutateAsync: withdrawal, isPending } = useWithdrawal();
  const { address } = useAccount();

  const { data: balance } = useBalance({
    address,
  });

  const onWithdrawClick = useCallback(async () => {
    if (!toAddress || !amount) {
      return;
    }

    await withdrawal({
      to: toAddress as Hex,
      amount,
    });

    onSuccess();
  }, [amount, onSuccess, toAddress, withdrawal]);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="h-[300px] flex flex-col items-center"
      >
        {isPending ? (
          <ProcessingSheetBody />
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>
                <div className="text-md flex flex-row items-center">
                  Withdrawal on{' '}
                  <img
                    src="/base.png"
                    alt="base"
                    className="w-4 h-4 mx-1"
                  ></img>
                  Base
                </div>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col items-center gap-y-2 w-full">
              <Input
                style={{
                  width: 'calc(80% - 27px)',
                }}
                type="text"
                onChange={e => {
                  setToAddress(e.target.value);
                }}
                placeholder="withdrawal to address"
                autoFocus={false}
              ></Input>
              <div className="flex flex-row items-center justify-center gap-x-2 w-[80%]">
                <Input
                  className="w-full"
                  type="number"
                  placeholder="amount"
                  onChange={e => {
                    setAmount(parseEther(e.target.value));
                  }}
                  autoFocus={false}
                ></Input>
                <div className="text-sm opacity-60">ETH</div>
              </div>
              <div className="text-sm opacity-60">
                Balance{' '}
                {balance?.value !== undefined
                  ? formatEthBalance(balance?.value)
                  : ''}
                ETH
              </div>
            </div>
            <Button
              className="mt-4"
              onClick={() => {
                onWithdrawClick();
              }}
            >
              Withdraw
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default WithdrawalSheet;
