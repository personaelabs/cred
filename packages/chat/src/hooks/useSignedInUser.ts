import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { usePrivy } from '@privy-io/react-auth';

const useSignedInUser = () => {
  const router = useRouter();
  const { user, ready } = usePrivy();

  useEffect(() => {
    (async () => {
      if (ready) {
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
  }, [router, user, ready]);

  return { data: ready ? user : null, ready };
};

export default useSignedInUser;
