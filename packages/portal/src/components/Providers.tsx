'use client';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MobileFooter from '@/components/MobileFooter';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import {
  HeaderContextProvider,
  useHeaderOptions,
} from '@/contexts/HeaderContext';
import MobileHeader from '@/components/MobileHeader';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSignedInUser from '@/hooks/useSignedInUser';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { WagmiProvider, useSetActiveWallet } from '@privy-io/wagmi';
import useIsPwa from '@/hooks/useIsPwa';
import wagmiConfig from '@/lib/wagmiConfig';
import { FooterContextProvider } from '@/contexts/FooterContext';
import { DialogContextProvider, useDialog } from '@/contexts/DialogContext';
import {
  MediaQueryProvider,
  useMediaQuery,
} from '@/contexts/MediaQueryContext';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import theme from '@/lib/theme';
import { getChain } from '@/lib/utils';
import ProcessingTxSheet from './ProcessingTxSheet';
import { DialogType } from '@/types';
import FundWalletSheet from './FundWalletSheet';
import mixpanel from 'mixpanel-browser';
import useIsAuthenticated from '@/hooks/useIsAuthenticated';

const NODE_ENV = process.env.NODE_ENV;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: NODE_ENV === 'development',
      retry: NODE_ENV === 'development' ? false : 3,
      gcTime: 1000 * 60 * 60 * 24,
    },
    mutations: {
      throwOnError: NODE_ENV === 'development',
    },
  },
});

const HEADER_HEIGHT = 60;

const Main = ({ children }: { children: React.ReactNode }) => {
  const { height } = useWindowDimensions();
  const { options } = useHeaderOptions();
  const pathname = usePathname();
  const router = useRouter();
  const { data: signedInUser } = useSignedInUser();
  const isPwa = useIsPwa();
  const { isModalOpen } = usePrivy();
  const { openedDialog, closeDialog } = useDialog();
  const isAuthenticated = useIsAuthenticated();
  const [mixpanelInitialized, setMixpanelInitialized] = useState(false);

  const hideFooter =
    ['/signin', '/install-pwa'].includes(pathname) ||
    pathname.startsWith('/rooms/') ||
    isModalOpen;

  const { isMobile } = useMediaQuery();

  useEffect(() => {
    if (signedInUser) {
      mixpanel.init('4f57a2e1c29d0e91fe07d1292e325520', {
        debug: process.env.NODE_ENV === 'development',
        track_pageview: false,
        persistence: 'localStorage',
      });

      mixpanel.identify(signedInUser.id);
      setMixpanelInitialized(true);
    }
  }, [signedInUser]);

  useEffect(() => {
    if (mixpanelInitialized) {
      mixpanel.track('page_view', {
        pathname,
      });
    }
  }, [mixpanelInitialized, pathname]);

  useEffect(() => {
    (async () => {
      if (isPwa === false && isMobile === true) {
        router.push('/install-pwa');
      } else if (isAuthenticated === false) {
        if (pathname !== '/signin') {
          router.replace('/signin');
        } else {
          // Already on the sign in page
        }
      }
    })();
  }, [isPwa, router, isMobile, isAuthenticated, pathname]);

  useEffect(() => {
    const localStoragePersister = createSyncStoragePersister({
      storage: window.localStorage,
    });

    persistQueryClient({
      queryClient,
      persister: localStoragePersister,
      buster: '4',
    });
  }, []);

  const { ready: walletsReady, wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  useEffect(() => {
    if (walletsReady && signedInUser) {
      const embeddedWallet = wallets.find(
        wallet => wallet.walletClientType === 'privy'
      );
      if (embeddedWallet) {
        setActiveWallet(embeddedWallet);
      }
    }
  }, [walletsReady, wallets, setActiveWallet, signedInUser]);

  const footerHeight = hideFooter ? 0 : 70;

  return (
    <>
      <div className="h-full w-full flex flex-col items-center">
        <div className="h-full w-full md:w-[50%]">
          <MobileHeader
            title={options.title}
            description={options.description}
            showBackButton={options.showBackButton}
            headerRight={options.headerRight}
            backTo={options.backTo}
          ></MobileHeader>
          <div
            style={{
              height: `calc(${height}px - ${HEADER_HEIGHT + footerHeight}px)`,
            }}
          >
            {children}
          </div>
          {hideFooter ? <></> : <MobileFooter></MobileFooter>}
        </div>
      </div>
      <ProcessingTxSheet
        isOpen={openedDialog === DialogType.PROCESSING_TX}
      ></ProcessingTxSheet>
      <FundWalletSheet
        isOpen={openedDialog === DialogType.FUND_WALLET}
        onClose={() => {
          closeDialog();
        }}
      ></FundWalletSheet>
    </>
  );
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <PrivyProvider
        appId="clw1tqoyj02yh110vokuu7yc5"
        config={{
          defaultChain: getChain(),
          supportedChains: [getChain()],
          appearance: {
            theme: 'dark',
            accentColor: theme.orange as `#${string}`,
            logo: 'https://creddd.xyz/personae-logo.svg',
          },
          // Create embedded wallets for users who don't have a wallet
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            <MediaQueryProvider>
              <HeaderContextProvider>
                <FooterContextProvider>
                  <DialogContextProvider>
                    <Main>{children}</Main>
                  </DialogContextProvider>
                </FooterContextProvider>
              </HeaderContextProvider>
            </MediaQueryProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
      <Toaster richColors expand></Toaster>
    </ThemeProvider>
  );
}
