import credddRpc from '@/lib/credddRpc';
import { useQuery } from '@tanstack/react-query';

const getCreddd = async (credddId: string) => {
  const creddd = await credddRpc.getCreddd({ credddId });
  console.log({ credddId, creddd });
  return creddd;
};

const useCreddd = (credddId: string) => {
  return useQuery({
    queryKey: ['creddd', { credddId }],
    queryFn: () => getCreddd(credddId),
  });
};

export default useCreddd;
