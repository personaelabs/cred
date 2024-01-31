import { useUserAccount } from '@/contexts/UserAccountContext';
import { useEffect, useState } from 'react';

// Get a Twitter OAuth link from the backend.
const useGetOAuthLink = (group: string) => {
  const [link, setLink] = useState<string | null>(null);
  const { pubKey } = useUserAccount();

  useEffect(() => {
    const getOAuthLink = async () => {
      if (pubKey) {
        const searchParams = new URLSearchParams();
        // We need to pass the group handle as a query parameter
        // so the server can redirect the client to the correct page after
        // the OAuth flow is complete.
        searchParams.set('group', group);
        searchParams.set('publicKey', pubKey);
        const queryString = searchParams.toString();

        const res = await fetch(`/api/twitter-auth/link?${queryString}`);
        const data = await res.json();
        setLink(data.url);
      }
    };

    getOAuthLink();
  }, [group, pubKey]);

  return link;
};

export default useGetOAuthLink;
