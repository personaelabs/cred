import { useAccount } from 'wagmi';
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
import { useSendTransaction } from '@privy-io/react-auth';
import useRoom from './useRoom';

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
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const { sendTransaction } = useSendTransaction();
  const { data: room } = useRoom(roomId);

  const result = useMutation({
    mutationFn: async () => {
      if (!address) {
        throw new Error('No connected address found.');
      }

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

      const data = encodeFunctionData({
        abi: CredAbi,
        functionName: 'buyToken',
        args: [address, roomTokenId, '0x'],
      });

      const txReceipt = await sendTransaction(
        {
          from: address,
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
