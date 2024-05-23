'use client';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { useEffect, useState } from 'react';
import { ArrowDownToLine, CirclePlus } from 'lucide-react';
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
import useTradeHistory from '@/hooks/useTradeHistory';
import { TradeLog } from '@/hooks/useTradeHistory';
import useRoom from '@/hooks/useRoom';
import { tokenIdToRoomId } from '@cred/shared';
import Scrollable from '@/components/Scrollable';
import WithdrawalSheet from '@/components/WithdrawalSheet';
import ClickableBox from '@/components/ClickableBox';

interface TradeHistoryListItemProps {
  log: TradeLog;
  userAddress: Hex;
}

const TradeHistoryListItem = (props: TradeHistoryListItemProps) => {
  const { log, userAddress } = props;

  const { value, from, to, id } = log.args;
  const isPurchase = to === userAddress;

  const { data: room } = useRoom(id ? tokenIdToRoomId(id) : '');

  if (!value || !from || !to) {
    // TODO: Report error
    return null;
  }

  return (
    <div className="flex flex-row gap-x-2 justify-between px-[32px]">
      <div>
        <div
          className={`text-xs ${isPurchase ? 'text-green-400' : 'text-blue-400'}`}
        >
          {isPurchase ? 'Purchased' : 'Sold'}
        </div>
        <div>{room?.name}</div>
      </div>
      <div>{formatEthBalance(value)} ETH</div>
    </div>
  );
};

const WalletPage = () => {
  const { setOptions } = useHeaderOptions();
  // const { wallets } = useWallets();
  const { address } = useAccount();
  const { data } = useBalance({
    address,
  });
  const { exportWallet } = usePrivy();
  const { data: tradeHistory } = useTradeHistory();
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
            <ClickableBox
              className="flex flex-row gap-x-2 items-center mt-[50px]"
              onClick={async () => {
                copyTextToClipboard(address as string);
                toast.info(`Copied address ${trimAddress(address as Hex)}`);
              }}
            >
              <CirclePlus className="w-4 h-4" color={theme.orange}></CirclePlus>
              <div className="text-md">Deposit on Base</div>
            </ClickableBox>
            <ClickableBox
              className="flex flex-row gap-x-2 items-center mt-[20px]"
              onClick={() => {
                setIsWithdrawalSheetOpen(true);
              }}
            >
              <ArrowDownToLine
                className="mr-2 w-4 h-4"
                color={theme.orange}
              ></ArrowDownToLine>
              <div className="text-md">Withdrawal</div>
            </ClickableBox>
            <div className="mt-[50px]">
              <Button onClick={exportWallet} variant="link">
                Export wallet
              </Button>
            </div>
            <div className="mt-4 opacity-60 text-sm text-left w-full px-4">
              Activity
            </div>
            <div className="flex flex-col gap-y-2 mt-[50px]">
              {tradeHistory?.map((log, index) => (
                <TradeHistoryListItem
                  key={index}
                  log={log}
                  userAddress={address as Hex}
                />
              ))}
            </div>
          </div>
        </div>
      </Scrollable>
      <WithdrawalSheet
        onSuccess={() => {
          setIsWithdrawalSheetOpen(false);
        }}
        isOpen={isWithdrawalSheetOpen}
      ></WithdrawalSheet>
    </>
  );
};

export default WalletPage;
