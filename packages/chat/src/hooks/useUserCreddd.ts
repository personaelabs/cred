import { useQuery } from '@tanstack/react-query';
import useSignedInUser from './useSignedInUser';
import credddApi from '@/lib/credddApi';
import { UserCredddResponse } from '@/types';

const getUserCreddd = async (userId: string) => {
  const response = await credddApi.get<UserCredddResponse>(
    `/api/fc-accounts/${userId}`
  );
  return response.data;
};

const useUserCreddd = () => {
  const { data: signedInUser } = useSignedInUser();

  return useQuery({
    queryKey: ['user-creddd'],
    queryFn: async () => {
      return getUserCreddd(signedInUser!.id);
    },
    enabled: !!signedInUser,
  });
};

export default useUserCreddd;
