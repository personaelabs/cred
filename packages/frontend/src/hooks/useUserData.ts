import { GetUserResponse } from '@/app/api/fc-accounts/[fid]/route';
import { useEffect, useState } from 'react';
import OG_USERS from '@/lib/creddd1Users';
import { captureFetchError } from '@/lib/utils';
import { toast } from 'sonner';

const useUserData = (fid: string | null) => {
  const [user, setUser] = useState<GetUserResponse | null>(null);

  useEffect(() => {
    (async () => {
      if (fid) {
        const fidIsOgUsername = !!OG_USERS[fid];
        // If the user is creddd 1.0 user, there's no data to fetch
        if (!fidIsOgUsername) {
          const response = await fetch(`/api/fc-accounts/${fid}`, {
            cache: 'no-store',
          });
          if (response.ok) {
            const data = (await response.json()) as GetUserResponse;
            setUser(data);
          } else {
            toast.error('Failed to fetch user data');
            await captureFetchError(response);
          }
        }
      }
    })();
  }, [fid]);

  return user;
};

export default useUserData;
