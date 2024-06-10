'use client';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FooterNavigation from '@/components/FooterNavigation';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import {
  HeaderContextProvider,
  useHeaderOptions,
} from '@/contexts/HeaderContext';
import Header from '@/components/Header';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSignedInUser from '@/hooks/useSignedInUser';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { WagmiProvider, useSetActiveWallet } from '@privy-io/wagmi';
import useIsPwa from '@/hooks/useIsPwa';
import wagmiConfig from '@/lib/wagmiConfig';
import { FooterContextProvider } from '@/contexts/FooterContext';
import {
  DialogContextProvider,
  DialogType,
  useDialog,
} from '@/contexts/DialogContext';
import {
  MediaQueryProvider,
  useMediaQuery,
} from '@/contexts/MediaQueryContext';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import theme from '@/lib/theme';
import { getChain } from '@/lib/utils';
import ProcessingTxSheet from './bottom-sheets/ProcessingTxSheet';
import FundWalletSheet from './bottom-sheets/FundWalletSheet';
import mixpanel from 'mixpanel-browser';
import useIsAuthenticated from '@/hooks/useIsAuthenticated';
import useIsUsernameSet from '@/hooks/useIsUsernameSet';
import useInviteCodeSet from '@/hooks/useIsInviteCodeSet';

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
    pathname.startsWith('/chats/') ||
    isModalOpen;

  const { isMobile } = useMediaQuery();

  const isUsernameSet = useIsUsernameSet();

  // Redirect to setup username page if the user hasn't set a username
  useEffect(() => {
    if (pathname !== '/setup-username' && pathname !== '/enter-invite-code') {
      if (isUsernameSet === false) {
        router.push('/setup-username');
      }
    }
  }, [isUsernameSet, router, pathname]);

  const isInviteCodeSet = useInviteCodeSet();

  // Redirect to setup invite code page if the user hasn't set an invite code
  useEffect(() => {
    if (pathname !== '/setup-username' && pathname !== '/enter-invite-code') {
      if (isInviteCodeSet === false) {
        router.push('/enter-invite-code');
      }
    }
  }, [isInviteCodeSet, pathname, router]);

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
          <Header
            title={options.title}
            description={options.description}
            showBackButton={options.showBackButton}
            headerRight={options.headerRight}
            backTo={options.backTo}
          ></Header>
          <div
            style={{
              height: `calc(${height}px - ${HEADER_HEIGHT + footerHeight}px)`,
            }}
          >
            {children}
          </div>
          {hideFooter ? <></> : <FooterNavigation></FooterNavigation>}
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
