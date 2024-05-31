import { useMutation } from '@tanstack/react-query';
import { authSignedInUser } from '@/lib/auth';
import { useLogin } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';

const useSignIn = () => {
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const { login } = useLogin({
    onComplete: async () => {
      setIsSigningIn(true);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }
      const usernameIsSet = await authSignedInUser(accessToken);

      if (usernameIsSet) {
        router.push('/enable-notifications');
      } else {
        router.push('/setup-username');
      }
    },
  });

  const result = useMutation({
    mutationFn: async () => {
      await login();
    },
  });

  return {
    ...result,
    isSigningIn: isSigningIn,
  };
};

export default useSignIn;
