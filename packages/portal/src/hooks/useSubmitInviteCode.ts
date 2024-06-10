import axios from '@/lib/axios';
import { usePrivy } from '@privy-io/react-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useSignedInUser from './useSignedInUser';
import userKeys from '@/queryKeys/userKeys';

const submitInviteCode = async ({
  inviteCode,
  accessToken,
}: {
  inviteCode: string;
  accessToken: string;
}) => {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  await axios.post(
    `/api/invite-codes/${inviteCode}`,
    {},
    {
      headers,
    }
  );
};

const useSubmitInviteCode = () => {
  const { getAccessToken } = usePrivy();
  const { data: signedInUser } = useSignedInUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error('User is not authenticated');
      }

      await submitInviteCode({
        inviteCode,
        accessToken,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userKeys.user(signedInUser?.id),
      });
    },
  });
};

export default useSubmitInviteCode;
