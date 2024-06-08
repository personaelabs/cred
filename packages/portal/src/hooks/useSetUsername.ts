import axios from '@/lib/axios';
import { SetUsernameRequestBody } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useSignedInUser from './useSignedInUser';

const setUsername = async ({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) => {
  const body: SetUsernameRequestBody = { username };
  await axios.patch(`/api/users/${userId}`, body);
};

const useSetUsername = () => {
  const { data: signedInUser } = useSignedInUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      if (!signedInUser) {
        throw new Error('User is not signed in');
      }

      await setUsername({
        userId: signedInUser.id,
        username,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'user',
          {
            userId: signedInUser?.id,
          },
        ],
      });
    },
  });
};

export default useSetUsername;
