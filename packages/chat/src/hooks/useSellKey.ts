import { CredAbi } from '@cred/shared';
import { Hex, encodeFunctionData, formatEther } from 'viem';
import axios from '@/lib/axios';
import { SyncRoomRequestBody } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoomTokenId } from '@/lib/utils';
import { CRED_CONTRACT_ADDRESS } from '@/lib/contract';
import { useState } from 'react';
import { toast } from 'sonner';
import { useSendTransaction, useWallets } from '@privy-io/react-auth';
import useRoom from './useRoom';
import wagmiConfig from '../lib/wagmiConfig';
import { readContract } from '@wagmi/core';

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

const getCurrentSellPrice = async (roomIdBigInt: bigint) => {
  return await readContract(wagmiConfig, {
    abi: CredAbi,
    address: CRED_CONTRACT_ADDRESS,
    functionName: 'getBuyPrice',
    args: [roomIdBigInt],
  });
};

const useSellKey = (roomId: string) => {
  const queryClient = useQueryClient();
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const { sendTransaction } = useSendTransaction();
  const { data: room } = useRoom(roomId);
  const { wallets } = useWallets();

  const result = useMutation({
    mutationFn: async () => {
      const roomIdBigInt = getRoomTokenId(roomId);

      const embeddedWallet = wallets.find(
        wallet => wallet.walletClientType === 'privy'
      );

      if (!embeddedWallet) {
        throw new Error('No embedded wallet found.');
      }

      const data = encodeFunctionData({
        abi: CredAbi,
        functionName: 'sellToken',
        args: [roomIdBigInt],
      });

      const sellPrice = await getCurrentSellPrice(roomIdBigInt);

      const formattedKeyPrice = formatEther(sellPrice);

      const txReceipt = await sendTransaction(
        {
          from: embeddedWallet.address,
          to: CRED_CONTRACT_ADDRESS,
          data,
        },
        {
          header: `Sell ${room?.name} key`,
          description: `You will receive ${formattedKeyPrice} ETH (estimated)`,
          buttonText: 'Sell key',
        }
      );

      setIsProcessingTx(true);

      await sendTransactionId({
        roomId,
        txId: txReceipt.transactionHash as Hex,
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
