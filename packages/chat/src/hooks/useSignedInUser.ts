import { useQuery } from '@tanstack/react-query';
import { SignedInUser } from '@/types';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

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
  const result = useQuery({
    queryKey: ['signed-in-user'],
    queryFn: async (): Promise<SignedInUser | null> => {
      const signedInUser = await getSignedInUser();

      if (!signedInUser) {
        console.log('No user found, redirecting to signin');
        router.push('/signin');
        return null;
      }

      if (!(await isAuthenticated(signedInUser.fid!))) {
        console.log('User is not authenticated, redirecting to signin');
        router.push('SignIn');
        return null;
      }

      return signedInUser;
    },
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (result.error) {
      console.error('Error fetching signed in user', result.error);
    }
  }, [result.error]);

  return result;
};

export default useSignedInUser;
