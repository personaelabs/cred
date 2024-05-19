import { useAccount, useWriteContract } from 'wagmi';
import { CredAbi } from '@cred/shared';
import { readContract } from '@wagmi/core';
import wagmiConfig from '../lib/wagmiConfig';
import { Hex } from 'viem';
import axios from '@/lib/axios';
import { SyncRoomRequestBody } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoomTokenId } from '@/lib/utils';
import { CRED_CONTRACT_ADDRESS } from '@/lib/contract';
import { useState } from 'react';
import { toast } from 'sonner';

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
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [isProcessingTx, setIsProcessingTx] = useState(false);

  const result = useMutation({
    mutationFn: async () => {
      if (!address) {
        throw new Error('No connected address found.');
      }

      const roomIdBigInt = getRoomTokenId(roomId);

      const value = await readContract(wagmiConfig, {
        abi: CredAbi,
        address: CRED_CONTRACT_ADDRESS,
        functionName: 'getBuyPrice',
        args: [roomIdBigInt],
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

      const txId = await writeContractAsync({
        abi: CredAbi,
        address: CRED_CONTRACT_ADDRESS,
        functionName: 'buyToken',
        args: [address, roomIdBigInt, '0x'],
        value: value + fee,
      });

      setIsProcessingTx(true);

      await sendTransactionId({
        roomId,
        txId,
      });

      setIsProcessingTx(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['key-price', roomId] });
      queryClient.invalidateQueries({ queryKey: ['purchased-rooms'] });

      toast.success('Purchase complete');
    },
  });

  return { ...result, isProcessingTx };
};

export default useBuyKey;
