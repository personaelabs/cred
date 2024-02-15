import { GetUserResponse } from '@/app/api/fc-accounts/[fid]/route';
import { useEffect, useState } from 'react';

const useUser = (fid: string) => {
  const [user, setUser] = useState<GetUserResponse | null>(null);

  useEffect(() => {
    (async () => {
      const response = await fetch(`/api/fc-accounts/${fid}`);
      if (!response.ok) {
        throw new Error('User fetch failed');
      }
      const data = (await response.json()) as GetUserResponse;
      setUser(data);
    })();
  }, [fid]);

  return user;
};

export default useUser;
