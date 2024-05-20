import { useLogout } from '@privy-io/react-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut as firebaseSignOut, getAuth } from 'firebase/auth';

const signOut = async () => {
  await firebaseSignOut(getAuth());
};

const useSignOut = () => {
  const { logout } = useLogout();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sign-out'],
    mutationFn: async () => {
      await logout();

      await signOut();
      queryClient.clear();
    },
  });
};

export default useSignOut;
