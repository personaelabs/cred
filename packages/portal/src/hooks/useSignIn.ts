import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authSignedInUser } from '@/lib/auth';
import { useLogin } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';

const useSignIn = () => {
  const router = useRouter();
  const { getAccessToken, logout } = usePrivy();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const queryClient = useQueryClient();

  const { login } = useLogin({
    onComplete: async () => {
      setIsSigningIn(true);

      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }

      const signInResponse = await authSignedInUser({
        accessToken,
      });

      await queryClient.invalidateQueries({
        queryKey: ['signed-in-user'],
      });

      const user = signInResponse.user;
      const isUsernameSet = user ? user.username !== '' : false;

      if (!isUsernameSet) {
        router.push('/setup-username');
      } else {
        router.push('/enable-notifications');
      }
    },
  });

  const result = useMutation({
    mutationFn: async () => {
      setIsSigningIn(true);
      // Logout before logging in to ensure the user is signed out
      await logout();

      await login();
    },
  });

  return {
    ...result,
    isSigningIn: isSigningIn,
  };
};

export default useSignIn;
