import { useEffect, useState } from 'react';
import useSignedInUser from '@/hooks/useSignedInUser';
import mixpanel from 'mixpanel-browser';
import { usePathname } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';

const useMixpanel = () => {
  const { data: signedInUser } = useSignedInUser();
  const [mixpanelInitialized, setMixpanelInitialized] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (signedInUser) {
      if (!process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
        Sentry.captureException(
          'Missing NEXT_PUBLIC_MIXPANEL_TOKEN environment variable'
        );
        console.error(
          'Missing NEXT_PUBLIC_MIXPANEL_TOKEN environment variable'
        );
      } else {
        mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN, {
          debug: process.env.NODE_ENV === 'development',
          track_pageview: false,
          persistence: 'localStorage',
        });

        mixpanel.identify(signedInUser.id);
        setMixpanelInitialized(true);
      }
    }
  }, [signedInUser]);

  useEffect(() => {
    if (mixpanelInitialized) {
      mixpanel.track('page_view', {
        pathname,
      });
    }
  }, [mixpanelInitialized, pathname]);
};

export default useMixpanel;
