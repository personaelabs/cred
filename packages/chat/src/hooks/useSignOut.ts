import { useSignIn as useFcSignIn } from '@farcaster/auth-kit';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut as firebaseSignOut, getAuth } from 'firebase/auth';

const signOut = async () => {
  await firebaseSignOut(getAuth());
  localStorage.removeItem('user');
};

const useSignOut = () => {
  const { signOut: fcSignOut } = useFcSignIn({});
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sign-out'],
    mutationFn: async () => {
      fcSignOut();

      await signOut();
      queryClient.clear();
    },
  });
};

export default useSignOut;
