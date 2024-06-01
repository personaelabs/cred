import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authSignedInUser } from '@/lib/auth';
import { useLogin } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';

export const saveInviteCode = (inviteCode: string) => {
  localStorage.setItem('portal.inviteCode', inviteCode);
};

const getInviteCode = () => {
  return localStorage.getItem('portal.inviteCode');
};

const useSignIn = () => {
  const router = useRouter();
  const { getAccessToken, logout } = usePrivy();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const queryClient = useQueryClient();

  const { login } = useLogin({
    onComplete: async () => {
      setIsSigningIn(true);
      const inviteCode = getInviteCode();

      if (!inviteCode) {
        throw new Error('Invite code not found');
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }
      const usernameIsSet = await authSignedInUser({
        accessToken,
        inviteCode,
      });

      await queryClient.invalidateQueries({ queryKey: ['is-authenticated'] });

      if (usernameIsSet) {
        router.push('/enable-notifications');
      } else {
        router.push('/setup-username');
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
