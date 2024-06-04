import { PortalAbi } from '@cred/shared';
import { getRoomTokenId } from '@/lib/utils';
import { PORTAL_CONTRACT_ADDRESS } from '@/lib/contract';
import { useQuery } from '@tanstack/react-query';
import { readContract } from '@wagmi/core';
import wagmiConfig from '../lib/wagmiConfig';

const useBuyPrice = (roomId: string) => {
  const roomIdBigInt = getRoomTokenId(roomId);

  return useQuery({
    queryKey: ['buy-price', roomId],
    queryFn: async () => {
      const amount = BigInt(1);
      const result = readContract(wagmiConfig, {
        abi: PortalAbi,
        address: PORTAL_CONTRACT_ADDRESS,
        functionName: 'getBuyPrice',
        args: [roomIdBigInt, amount],
      });

      return result;
    },
  });
};

export default useBuyPrice;
