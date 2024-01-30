import { useEffect, useState } from 'react';

const useGetOAuthLink = (group: string) => {
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    const getOAuthLink = async () => {
      const searchParams = new URLSearchParams();
      // We need to pass the group handle as a query parameter
      // so the server can redirect the client to the correct page after
      // the OAuth flow is complete.
      searchParams.set('group', group);
      const queryString = searchParams.toString();

      const res = await fetch(`/api/twitter-auth/link?${queryString}`);
      const data = await res.json();
      setLink(data.url);
    };

    getOAuthLink();
  }, [group]);

  return link;
};

export default useGetOAuthLink;
