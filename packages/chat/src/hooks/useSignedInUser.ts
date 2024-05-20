import { SignedInUser } from '@/types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { usePrivy } from '@privy-io/react-auth';
import { getAuth } from 'firebase/auth';

export const getSignedInUser = (): SignedInUser | null => {
  const result = localStorage.getItem('user');

  if (result) {
    const user: SignedInUser = JSON.parse(result);
    return user;
  } else {
    return null;
  }
};

const useSignedInUser = () => {
  const router = useRouter();
  const { user, ready: privyReady } = usePrivy();
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    (async () => {
      await getAuth().authStateReady();
      setIsAuthReady(true);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (privyReady) {
        if (!user) {
          console.log('Not logged in, redirecting to signin');
          router.push('/signin');
          return null;
        }

        if (!(await isAuthenticated(user.id))) {
          console.log('User is not authenticated, redirecting to signin');
          router.push('/signin');
          return null;
        }
      }
    })();
  }, [router, user, privyReady]);

  const ready = isAuthReady && privyReady;
  return { data: ready ? user : null, ready };
};

export default useSignedInUser;
