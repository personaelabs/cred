import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { isAuthenticatedToFirestore } from './useIsAuthenticated';

const useSignedInUser = () => {
  const { user } = usePrivy();

  return useQuery({
    queryKey: ['signed-in-user'],
    queryFn: async () => {
      await isAuthenticatedToFirestore(user!.id);
      return user;
    },
    initialData: null,
    enabled: !!user,
    refetchOnMount: true,
  });
};

export default useSignedInUser;
