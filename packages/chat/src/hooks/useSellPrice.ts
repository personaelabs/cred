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
      const amount = BigInt(1);

      const tokenSupply = await readContract(wagmiConfig, {
        abi: CredAbi,
        address: CRED_CONTRACT_ADDRESS,
        functionName: 'tokenIdToSupply',
        args: [roomIdBigInt],
      });

      if (tokenSupply === BigInt(0)) {
        return BigInt(0);
      }

      return await readContract(wagmiConfig, {
        abi: CredAbi,
        address: CRED_CONTRACT_ADDRESS,
        functionName: 'getSellPrice',
        args: [roomIdBigInt, amount],
      });
    },
  });
};

export default useSellPrice;
