import credddRpc from '@/lib/credddRpc';
import credddKeys from '@/queryKeys/credddKeys';
import { useQuery } from '@tanstack/react-query';

const getCreddd = async (credddId: string) => {
  const creddd = await credddRpc.getCreddd({ credddId });
  return creddd;
};

const useCreddd = (credddId: string) => {
  return useQuery({
    queryKey: credddKeys.creddd(credddId),
    queryFn: () => getCreddd(credddId),
  });
};

export default useCreddd;
