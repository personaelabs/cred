'use client';

import { Button } from '@/components/ui/button';
import { useUserAccount } from '@/contexts/UserAccountContext';
import useGetOAuthLink from '@/hooks/useGetOAuthLink';
import useProver from '@/hooks/useProver';
import { postJSON } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const VerificationPage = ({
  params: { group },
}: {
  params: { group: string };
}) => {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const { pubKey } = useUserAccount();
  // Connect to Twitter

  useEffect(() => {
    const currentURL = window.location.href;

    // Create a URLSearchParams object to parse the query parameters
    const urlSearchParams = new URLSearchParams(new URL(currentURL).search);
    const _username = urlSearchParams.get('username');

    setUsername(_username);
  }, []);

  const link = useGetOAuthLink(group);
  const { prove } = useProver({
    group,
  });

  // After server receives a callback from Twitter,
  // it will redirect to this page with the username as a query parameter
  const isTwitterConnected = username !== null;

  return (
    <div className="flex flex-col gap-[30px] items-center justify-center">
      <div className="text-3xl">Add creddd</div>
      <div>Connect your Twitter account and add reputation</div>
      <div>
        <Button
          onClick={() => {
            if (link) {
              router.push(link);
            }
          }}
          disabled={isTwitterConnected}
        >
          {isTwitterConnected ? (
            <Check className="mr-2 w-4 h-4"></Check>
          ) : (
            <></>
          )}
          Connect Twitter
        </Button>
      </div>
      <div>
        <Button
          disabled={!isTwitterConnected}
          onClick={async () => {
            if (username) {
              const verificationBody = await prove();

              if (verificationBody) {
                const result = await postJSON({
                  url: `/api/users/${pubKey}/attestations`,
                  method: 'POST',
                  body: verificationBody,
                });

                if (result.status !== 200) {
                  throw new Error('Verification failed');
                } else {
                  toast.success('Verification successful!');
                }
                router.push(`/`);
              }
            }
          }}
        >
          Verify
        </Button>
      </div>
    </div>
  );
};

export default VerificationPage;
