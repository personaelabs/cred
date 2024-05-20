import { useMutation } from '@tanstack/react-query';
import { authSignedInUser } from '@/lib/auth';
import { useLogin } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

const useSignIn = () => {
  const router = useRouter();
  const { getAccessToken } = usePrivy();

  const { login } = useLogin({
    onComplete: async () => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }
      await authSignedInUser(accessToken);
      router.push('/');
    },
  });

  return useMutation({
    mutationFn: async () => {
      await login();
    },
  });
};

export default useSignIn;
