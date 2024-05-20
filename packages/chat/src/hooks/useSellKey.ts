import { useAccount, useWriteContract } from 'wagmi';
import { CredAbi } from '@cred/shared';
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

const useSellKey = (roomId: string) => {
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

      const txId = await writeContractAsync({
        abi: CredAbi,
        address: CRED_CONTRACT_ADDRESS,
        functionName: 'sellToken',
        args: [roomIdBigInt],
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
      queryClient.invalidateQueries({ queryKey: ['joined-rooms'] });

      toast.success('Sold key');
    },
  });

  return { ...result, isProcessingTx };
};

export default useSellKey;
