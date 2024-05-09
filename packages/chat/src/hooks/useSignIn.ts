import { useQueryClient } from '@tanstack/react-query';
import { SignedInUser } from '@/types';
import { StatusAPIResponse } from '@farcaster/auth-kit';
import { useCallback } from 'react';
import { authSignedInUser } from '@/lib/auth';

const signIn = async (statusApiResponse: StatusAPIResponse) => {
  const signedInUser: SignedInUser = statusApiResponse;

  if (!statusApiResponse.fid) {
    throw new Error('No fid found in status api response');
  }

  console.log(`Signing in as ${signedInUser.fid}`);

  // Store the user data in the local storage
  await localStorage.setItem('user', JSON.stringify(signedInUser));

  try {
    await authSignedInUser(signedInUser);
  } catch (e) {
    console.error('Error authenticating user');
    console.error(e);
    throw e;
  }
};

const useSignIn = () => {
  const queryClient = useQueryClient();

  const _signIn = useCallback(
    async (statusApiResponse: StatusAPIResponse) => {
      await signIn(statusApiResponse);
      await queryClient.invalidateQueries({ queryKey: ['signed-in-user'] });
    },
    [queryClient]
  );

  return { signIn: _signIn };
};

export default useSignIn;
