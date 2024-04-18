import { GetUserResponse } from '@/app/api/fc-accounts/[fid]/route';
import { SignedInUser } from '@/app/types';
import { captureFetchError } from '@/lib/utils';
import { StatusAPIResponse } from '@farcaster/auth-client';
import { useQuery } from '@tanstack/react-query';

const getSignedInUser = async (): Promise<SignedInUser | null> => {
  const siwfResponse = localStorage.getItem('siwfResponse');

  if (siwfResponse) {
    const siwfResponseJson: StatusAPIResponse = JSON.parse(siwfResponse);
    const fid = siwfResponseJson.fid;
    const response = await fetch(`/api/fc-accounts/${fid}`);

    if (!response.ok) {
      await captureFetchError(response);
      throw new Error('Failed to fetch signed-in user');
    }

    const data = (await response.json()) as GetUserResponse;

    return { ...data, siwfResponse: siwfResponseJson };
  } else {
    return null;
  }
};

const useSignedInUser = () =>
  useQuery({
    queryKey: ['signed-in-user'],
    queryFn: getSignedInUser,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

export default useSignedInUser;
