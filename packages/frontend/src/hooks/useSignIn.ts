import { StatusAPIResponse } from '@farcaster/auth-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const signIn = (statusApiResponse: StatusAPIResponse) => {
  localStorage.setItem('siwfResponse', JSON.stringify(statusApiResponse));
};

const useSignIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusApiResponse: StatusAPIResponse) => {
      signIn(statusApiResponse);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signed-in-user'] });
    },
  });
};

export default useSignIn;
