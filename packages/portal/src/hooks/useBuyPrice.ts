import { PORTAL_V1_CONTRACT_ADDRESS, PortalV1Abi } from '@cred/shared';
import { getRoomTokenId } from '@cred/shared';
import { useQuery } from '@tanstack/react-query';
import { readContract } from '@wagmi/core';
import wagmiConfig from '../lib/wagmiConfig';
import roomKeys from '@/queryKeys/roomKeys';

const useBuyPrice = (roomId: string) => {
  const roomIdBigInt = getRoomTokenId(roomId);

  return useQuery({
    queryKey: roomKeys.roomKeyBuyPrice(roomId),
    queryFn: async () => {
      const result = readContract(wagmiConfig, {
        abi: PortalV1Abi,
        address: PORTAL_V1_CONTRACT_ADDRESS,
        functionName: 'keyIdToPrice',
        args: [roomIdBigInt],
      });

      return result;
    },
  });
};

export default useBuyPrice;
