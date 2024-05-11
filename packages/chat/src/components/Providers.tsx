'use client';
// import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
// import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthKitProvider } from '@farcaster/auth-kit';
import DesktopHeader from '@/components/DesktopHeader';
import MobileFooter from '@/components/MobileFooter';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import {
  HeaderContextProvider,
  useHeaderOptions,
} from '@/contexts/HeaderContext';
import MobileHeader2 from '@/components/MobileHeader2';
import { usePathname, useRouter } from 'next/navigation';
import { NotificationsContextProvider } from '@/contexts/NotificationContext';
import { useEffect } from 'react';
import { isNotificationConfigured } from '@/lib/notification';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

/*
const persister = createSyncStoragePersister({
  storage: window.localStorage,
});
*/

const config = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'creddd.xyz',
  siweUri: 'http://creddd.xyz/login',
  relay: 'https://relay.farcaster.xyz',
};

const Main = ({ children }: { children: React.ReactNode }) => {
  const { height } = useWindowDimensions();
  const { options } = useHeaderOptions();
  const pathname = usePathname();
  const router = useRouter();

  const hideFooter = ['/signin'].includes(pathname);

  useEffect(() => {
    if (!isNotificationConfigured()) {
      router.push('/enable-notifications');
    }
  }, [router]);

  return (
    <div className="h-[100%]">
      <MobileHeader2
        title={options.title}
        showBackButton={options.showBackButton}
        headerRight={options.headerRight}
      ></MobileHeader2>
      <div style={{ height: `calc(${height}px - 130px)` }}>{children}</div>
      <MobileFooter isHidden={hideFooter}></MobileFooter>
    </div>
  );
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <NotificationsContextProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthKitProvider config={config}>
              <DesktopHeader></DesktopHeader>
              <HeaderContextProvider>
                <Main>{children}</Main>
              </HeaderContextProvider>
            </AuthKitProvider>
          </TooltipProvider>
        </QueryClientProvider>
        <Toaster richColors expand></Toaster>
      </NotificationsContextProvider>
    </ThemeProvider>
  );
}
