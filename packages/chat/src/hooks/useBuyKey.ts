import { CredAbi } from '@cred/shared';
import { readContract } from '@wagmi/core';
import wagmiConfig from '../lib/wagmiConfig';
import { Hex, encodeFunctionData } from 'viem';
import axios from '@/lib/axios';
import { SyncRoomRequestBody } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoomTokenId } from '@/lib/utils';
import { CRED_CONTRACT_ADDRESS } from '@/lib/contract';
import { useState } from 'react';
import { toast } from 'sonner';
import { useSendTransaction, useWallets } from '@privy-io/react-auth';
import useRoom from './useRoom';
import { useBalance } from 'wagmi';

const sendTransactionId = async ({
  roomId,
  txId,
}: {
  roomId: string;
  txId: Hex;
}) => {
  const body: SyncRoomRequestBody = {
    buyTransactionHash: txId,
  };

  await axios.post(`/api/rooms/${roomId}/sync`, body);
};

const useBuyKey = (roomId: string) => {
  const queryClient = useQueryClient();
  const { wallets } = useWallets();
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const { sendTransaction } = useSendTransaction();
  const { data: room } = useRoom(roomId);

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

      const value = await readContract(wagmiConfig, {
        abi: CredAbi,
        address: CRED_CONTRACT_ADDRESS,
        functionName: 'getBuyPrice',
        args: [roomTokenId],
      });

      const fee = await readContract(wagmiConfig, {
        abi: CredAbi,
        address: CRED_CONTRACT_ADDRESS,
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
        toast.info('Please fund your wallet');
      } else {
        const data = encodeFunctionData({
          abi: CredAbi,
          functionName: 'buyToken',
          args: [privyAddress as Hex, roomTokenId, '0x'],
        });

        const txReceipt = await sendTransaction(
          {
            from: privyAddress,
            to: CRED_CONTRACT_ADDRESS,
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

        await sendTransactionId({
          roomId,
          txId: txReceipt.transactionHash as Hex,
        });

        setIsProcessingTx(false);
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['buy-price', roomId] });
      queryClient.invalidateQueries({ queryKey: ['sell-price', roomId] });
      await queryClient.invalidateQueries({ queryKey: ['purchased-rooms'] });
      await queryClient.invalidateQueries({ queryKey: ['purchasable-rooms'] });

      toast.success('Purchase complete');
    },
  });

  return { ...result, isProcessingTx };
};

export default useBuyKey;
