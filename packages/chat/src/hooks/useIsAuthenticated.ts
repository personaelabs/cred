import { usePrivy } from '@privy-io/react-auth';
import { getAuth } from 'firebase/auth';
import { useEffect, useState } from 'react';

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isPrivyReady) {
      console.log('Privy not ready');
      return;
    }

    if (!authenticated) {
      console.log('Not authenticated');
      setIsAuthenticated(false);
      return;
    }

    if (!user) {
      console.log('No user');
      setIsAuthenticated(false);
      return;
    }

    setIsAuthenticated(true);
  }, [authenticated, isPrivyReady, user]);

  return isAuthenticated;
};

export default useIsAuthenticated;
