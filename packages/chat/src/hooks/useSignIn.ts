import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SignedInUser } from '@/types';
import { StatusAPIResponse } from '@farcaster/auth-kit';
import { authSignedInUser } from '@/lib/auth';

const signIn = async (
  statusApiResponse: StatusAPIResponse
): Promise<SignedInUser> => {
  if (!statusApiResponse.fid) {
    throw new Error('No fid found in status api response');
  }

  const signedInUser: SignedInUser = {
    id: statusApiResponse.fid!.toString(),
    ...statusApiResponse,
  };

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

  return signedInUser;
};

const useSignIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusApiResponse: StatusAPIResponse) => {
      await signIn(statusApiResponse);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['signed-in-user'] });
    },
  });
};

export default useSignIn;
