import { useQuery } from '@tanstack/react-query';
import credddRpcClient from '@/lib/credddRpc';
import { Hex } from 'viem';

const useAddressGroups = (address: Hex | null) => {
  return useQuery({
    queryKey: ['address-groups', { address }],
    queryFn: async () => {
      const groups = await credddRpcClient.getAddressGroups(address!);
      console.log(groups);
      return groups;
    },
    enabled: !!address,
  });
};

export default useAddressGroups;
