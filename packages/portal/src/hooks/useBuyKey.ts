import { PortalAbi } from '@cred/shared';
import { readContract } from '@wagmi/core';
import wagmiConfig from '../lib/wagmiConfig';
import { Hex, encodeFunctionData } from 'viem';
import axios from '@/lib/axios';
import { SyncRoomRequestBody } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoomTokenId } from '@cred/shared';
import { PORTAL_CONTRACT_ADDRESS } from '@/lib/contract';
import { useState } from 'react';
import { toast } from 'sonner';
import { useSendTransaction, useWallets } from '@privy-io/react-auth';
import useRoom from './useRoom';
import { useBalance } from 'wagmi';
import { DialogType, useDialog } from '@/contexts/DialogContext';
import roomKeys from '@/queryKeys/roomKeys';

const sendTransactionId = async ({
  roomId,
  txId,
}: {
  roomId: string;
  txId: Hex;
}) => {
  const body: SyncRoomRequestBody = {
    txHash: txId,
  };

  await axios.post(`/api/rooms/${roomId}/sync`, body);
};

const useBuyKey = (roomId: string) => {
  const queryClient = useQueryClient();
  const { wallets } = useWallets();
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const { sendTransaction } = useSendTransaction();
  const { data: room } = useRoom(roomId);
  const { setOpenedSheet, closeDialog } = useDialog();

  const privyAccount = wallets?.find(
    wallet => wallet.walletClientType === 'privy'
  );

  const { data: balance } = useBalance({
    address: privyAccount ? (privyAccount.address as Hex) : undefined,
  });

  const result = useMutation({
    mutationFn: async () => {
      if (!privyAccount) {
        throw new Error('No privy account found.');
      }

      const privyAddress = privyAccount.address as Hex;
      const roomTokenId = getRoomTokenId(roomId);

      const amount = BigInt(1);
      const value = await readContract(wagmiConfig, {
        abi: PortalAbi,
        address: PORTAL_CONTRACT_ADDRESS,
        functionName: 'getBuyPrice',
        args: [roomTokenId, amount],
      });

      const fee = await readContract(wagmiConfig, {
        abi: PortalAbi,
        address: PORTAL_CONTRACT_ADDRESS,
        functionName: 'getProtocolFee',
        args: [value],
      });

      if (!value) {
        throw new Error('Failed to get price of.');
      }

      const totalCost = value + fee;

      if (balance && balance.value < totalCost) {
        // Show Fund Wallet modal
        // await privyAccount.fund();
        setOpenedSheet(DialogType.FUND_WALLET);
      } else {
        const data = encodeFunctionData({
          abi: PortalAbi,
          functionName: 'buyKeys',
          args: [privyAddress as Hex, roomTokenId, amount, '0x'],
        });

        const txReceipt = await sendTransaction(
          {
            from: privyAddress,
            to: PORTAL_CONTRACT_ADDRESS,
            data,
            value: value + fee,
          },
          {
            header: `Buy ${room?.name} key`,
            description: `1% protocol fee`,
            buttonText: 'Buy key',
          }
        );

        setIsProcessingTx(true);
        setOpenedSheet(DialogType.PROCESSING_TX);

        await sendTransactionId({
          roomId,
          txId: txReceipt.transactionHash as Hex,
        });

        setIsProcessingTx(false);
        toast.success('Purchase complete');
        closeDialog();
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: roomKeys.roomKeyBuyPrice(roomId),
      });
      queryClient.invalidateQueries({
        queryKey: roomKeys.roomKeySellPrice(roomId),
      });
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
    },
  });

  return { ...result, isProcessingTx };
};

export default useBuyKey;
