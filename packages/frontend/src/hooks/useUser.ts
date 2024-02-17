import { GetUserResponse } from '@/app/api/fc-accounts/[fid]/route';
import { useEffect, useState } from 'react';
import OG_USERS from '@/lib/creddd1Users';

const useUser = (fid: string) => {
  const [user, setUser] = useState<GetUserResponse | null>(null);

  useEffect(() => {
    (async () => {
      const fidIsOgUsername = !!OG_USERS[fid];
      // If the user is creddd 1.0 user, there's no data to fetch
      if (!fidIsOgUsername) {
        const response = await fetch(`/api/fc-accounts/${fid}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('User fetch failed');
        }
        const data = (await response.json()) as GetUserResponse;
        setUser(data);
      }
    })();
  }, [fid]);

  return user;
};

export default useUser;
