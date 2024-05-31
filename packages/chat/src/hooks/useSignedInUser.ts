import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';

const useSignedInUser = () => {
  const { user } = usePrivy();

  return useQuery({
    queryKey: ['signed-in-user'],
    queryFn: async () => {
      return user;
    },
    enabled: !!user,
  });
};

export default useSignedInUser;
