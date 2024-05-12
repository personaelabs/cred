'use client';
import '@rainbow-me/rainbowkit/styles.css';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
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
import { useEffect } from 'react';
import { isNotificationConfigured } from '@/lib/notification';
import useSignedInUser from '@/hooks/useSignedInUser';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { WagmiProvider } from 'wagmi';
import useIsPwa from '@/hooks/useIsPwa';
import wagmiConfig from '@/lib/wagmiConfig';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

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
  const { data: signedInUser } = useSignedInUser();
  const isPwa = useIsPwa();
  const hideFooter = ['/signin'].includes(pathname);

  useEffect(() => {
    if (signedInUser && isPwa && !isNotificationConfigured()) {
      router.replace('/enable-notifications');
    } else if (signedInUser && !isPwa) {
      router.replace('/');
    }
  }, [isPwa, router, signedInUser]);

  useEffect(() => {
    const localStoragePersister = createSyncStoragePersister({
      storage: window.localStorage,
    });

    persistQueryClient({
      queryClient,
      persister: localStoragePersister,
    });
  }, []);

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
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <TooltipProvider>
              <AuthKitProvider config={config}>
                <DesktopHeader></DesktopHeader>
                <HeaderContextProvider>
                  <Main>{children}</Main>
                </HeaderContextProvider>
              </AuthKitProvider>
            </TooltipProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
      <Toaster richColors expand></Toaster>
    </ThemeProvider>
  );
}
