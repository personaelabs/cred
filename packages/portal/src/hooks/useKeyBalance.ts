import { useQuery } from '@tanstack/react-query';
import { readContract } from '@wagmi/core';
import { Hex } from 'viem';
import wagmiConfig from '@/lib/wagmiConfig';
import { PORTAL_CONTRACT_ADDRESS } from '@/lib/contract';
import { PortalAbi } from '@cred/shared';

const useKeyBalance = ({
  address,
  tokenId,
}: {
  address: Hex | null;
  tokenId: bigint | null;
}) => {
  return useQuery({
    queryKey: ['key-balance', { address }],
    queryFn: async () => {
      return await readContract(wagmiConfig, {
        abi: PortalAbi,
        address: PORTAL_CONTRACT_ADDRESS,
        functionName: 'balanceOf',
        args: [address!, tokenId!],
      });
    },
    enabled: !!address && !!tokenId,
  });
};

export default useKeyBalance;
