import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { getAuth } from 'firebase/auth';

/**
 * Returns true if the user is authenticated to the given user ID on Firebase
 */
export const isAuthenticatedToFirestore = async (userId: string) => {
  await getAuth().authStateReady();
  const user = getAuth().currentUser;

  if (!user) {
    return false;
  }

  return user.uid === userId;
};

const useIsAuthenticated = () => {
  const { authenticated, ready: isPrivyReady, user } = usePrivy();

  return useQuery({
    queryKey: ['is-authenticated'],
    queryFn: async () => {
      if (isPrivyReady && !authenticated) {
        return false;
      }

      if (!user) {
        return false;
      }

      if (!(await isAuthenticatedToFirestore(user.id))) {
        return false;
      }

      return true;
    },
    refetchOnMount: true,
  });
};

export default useIsAuthenticated;
