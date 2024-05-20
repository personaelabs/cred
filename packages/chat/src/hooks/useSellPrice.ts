import { CredAbi } from '@cred/shared';
import { getRoomTokenId } from '@/lib/utils';
import { CRED_CONTRACT_ADDRESS } from '@/lib/contract';
import { useQuery } from '@tanstack/react-query';
import { readContract } from '@wagmi/core';
import wagmiConfig from '../lib/wagmiConfig';

const useSellPrice = (roomId: string) => {
  const roomIdBigInt = getRoomTokenId(roomId);

  return useQuery({
    queryKey: ['sell-price', roomId],
    queryFn: async () => {
      return await readContract(wagmiConfig, {
        abi: CredAbi,
        address: CRED_CONTRACT_ADDRESS,
        functionName: 'getSellPrice',
        args: [roomIdBigInt],
      });
    },
  });
};

export default useSellPrice;
