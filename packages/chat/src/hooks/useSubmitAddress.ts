import axios from '@/lib/axios';
import { ConnectAddressRequestBody } from '@/types';
import { usePrivy } from '@privy-io/react-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useSignedInUser from './useSignedInUser';
import { toast } from 'sonner';

const submitAddress = async ({
  body,
  accessToken,
}: {
  body: ConnectAddressRequestBody;
  accessToken: string;
}) => {
  await axios.post('/api/connected-addresses', body, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

const useSubmitAddress = () => {
  const { getAccessToken } = usePrivy();
  const queryClient = useQueryClient();
  const { data: singedInUser } = useSignedInUser();

  return useMutation({
    mutationFn: async (body: ConnectAddressRequestBody) => {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error('Failed to get access token');
      }

      await submitAddress({
        body,
        accessToken,
      });
    },
    onSuccess: () => {
      toast.success('Verified address');
      queryClient.invalidateQueries({
        queryKey: ['user', { userId: singedInUser?.id }],
      });
    },
  });
};

export default useSubmitAddress;
