import axios from '@/lib/axios';
import { useMutation } from '@tanstack/react-query';

const isInviteCodeValid = async (inviteCode: string) => {
  const result = await axios.get<{ isValid: boolean }>(
    `/api/invite-codes/${inviteCode}`
  );

  return result.data.isValid;
};

const useIsInviteCodeValid = () => {
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      return await isInviteCodeValid(inviteCode);
    },
  });
};

export default useIsInviteCodeValid;
