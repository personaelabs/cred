import { useMutation } from '@tanstack/react-query';
import { authSignedInUser } from '@/lib/auth';
import { useLogin } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';

const useSignIn = (inviteCode: string) => {
  const router = useRouter();
  const { getAccessToken, logout } = usePrivy();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const { login } = useLogin({
    onComplete: async () => {
      setIsSigningIn(true);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }
      const usernameIsSet = await authSignedInUser({
        accessToken,
        inviteCode,
      });

      if (usernameIsSet) {
        router.push('/enable-notifications');
      } else {
        router.push('/setup-username');
      }
    },
  });

  const result = useMutation({
    mutationFn: async () => {
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
