import { GetUserResponse } from '@/app/api/fc-accounts/[fid]/route';
import OG_USERS from '@/lib/creddd1Users';
import { useQuery } from '@tanstack/react-query';
import { captureFetchError } from '@/lib/utils';

const useUserQuery = (fid: string) =>
  useQuery({
    queryKey: ['user', { fid }],
    queryFn: async () => {
      const fidIsOgUsername = !!OG_USERS[fid];
      // If the user is creddd 1.0 user, there's no data to fetch
      if (!fidIsOgUsername) {
        const response = await fetch(`/api/fc-accounts/${fid}`, {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = (await response.json()) as GetUserResponse;

          return data;
        } else {
          await captureFetchError(response);
          throw new Error('Failed to fetch user data');
        }
      }
    },
  });

export default useUserQuery;
