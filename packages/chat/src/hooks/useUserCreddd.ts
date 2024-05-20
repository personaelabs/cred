import { useQuery } from '@tanstack/react-query';
import useSignedInUser from './useSignedInUser';
import credddApi from '@/lib/credddApi';
import { UserCredddResponse } from '@/types';

const getUserCreddd = async (fid: number) => {
  const response = await credddApi.get<UserCredddResponse>(
    `/api/fc-accounts/${fid}`
  );
  return response.data;
};

const useUserCreddd = () => {
  const { data: signedInUser } = useSignedInUser();

  return useQuery({
    queryKey: ['user-creddd'],
    queryFn: async () => {
      if (!signedInUser?.farcaster?.fid) {
        throw new Error("User hasn't linked a Farcaster account");
      }

      return getUserCreddd(signedInUser!.farcaster?.fid);
    },
    enabled: !!signedInUser,
  });
};

export default useUserCreddd;
