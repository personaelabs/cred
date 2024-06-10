import { useQuery } from '@tanstack/react-query';
import credddRpcClient from '@/lib/credddRpc';
import { Hex } from 'viem';
import credddKeys from '@/queryKeys/credddKeys';

const useAddressGroups = (address: Hex | null) => {
  return useQuery({
    queryKey: credddKeys.addressGroups(address),
    queryFn: async () => {
      const groups = await credddRpcClient.getAddressGroups(address!);
      return groups;
    },
    enabled: !!address,
  });
};

export default useAddressGroups;
