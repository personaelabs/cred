import { PORTAL_V1_CONTRACT_ADDRESS, PortalV1Abi } from '@cred/shared';
import { readContract } from '@wagmi/core';
import wagmiConfig from '../lib/wagmiConfig';
import { Hex, encodeFunctionData } from 'viem';
import axios from '@/lib/axios';
import { SyncRoomRequestBody } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoomTokenId } from '@cred/shared';
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

      const price = await readContract(wagmiConfig, {
        abi: PortalV1Abi,
        address: PORTAL_V1_CONTRACT_ADDRESS,
        functionName: 'keyIdToPrice',
        args: [roomTokenId],
      });

      if (!price) {
        throw new Error('Failed to get price of.');
      }

      if (balance && balance.value < price) {
        // Show Fund Wallet modal
        // await privyAccount.fund();
        setOpenedSheet(DialogType.FUND_WALLET);
      } else {
        const data = encodeFunctionData({
          abi: PortalV1Abi,
          functionName: 'buyKey',
          args: [privyAddress as Hex, roomTokenId],
        });

        const txReceipt = await sendTransaction(
          {
            from: privyAddress,
            to: PORTAL_V1_CONTRACT_ADDRESS,
            data,
            value: price,
          },
          {
            header: `Buy ${room?.name} key`,
            description: ``,
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
