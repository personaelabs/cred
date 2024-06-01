import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { getAuth } from 'firebase/auth';

/**
 * Returns true if the user is authenticated to the given user ID on Firebase
 */
export const isAuthenticatedToFirestore = async (userId: string) => {
  const auth = getAuth();
  await auth.authStateReady();
  auth.onAuthStateChanged(user => {
    console.log('User', user);
  });
  const user = auth.currentUser;

  if (!user) {
    console.log('No user');
    return false;
  }

  console.log('User', user);
  return user.uid === userId;
};

const useIsAuthenticated = () => {
  const { authenticated, ready: isPrivyReady, user } = usePrivy();

  return useQuery({
    queryKey: ['is-authenticated'],
    queryFn: async () => {
      if (!isPrivyReady) {
        console.log('Privy not ready');
        return null;
      }

      if (!authenticated) {
        console.log('Not authenticated');
        return false;
      }

      if (!user) {
        console.log('No user');
        return false;
      }

      return true;
    },
    refetchOnMount: true,
  });
};

export default useIsAuthenticated;
