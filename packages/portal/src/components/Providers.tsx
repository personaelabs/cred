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
import { useEffect } from 'react';
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
import useIsAuthenticated from '@/hooks/useIsAuthenticated';
import useIsUsernameSet from '@/hooks/useIsUsernameSet';
import useMixpanel from '@/hooks/useMixpanel';
import { mainnet } from 'viem/chains';
import {
  SignInMethodContextProvider,
  useSignInMethod,
} from '@/contexts/SignInMethodContext';

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
  useMixpanel();

  const hideFooter =
    ['/signin', '/signin-as', '/install-pwa', '/about'].includes(pathname) ||
    pathname.startsWith('/chats/') ||
    isModalOpen;

  const { isMobile } = useMediaQuery();

  const isUsernameSet = useIsUsernameSet();

  // Redirect to install page if the user is on mobile,
  // and the app is not installed as a PWA.
  const redirectToInstallPage =
    isPwa === false &&
    isMobile === true &&
    pathname !== '/install-pwa' &&
    pathname !== '/about' &&
    pathname !== '/signin-as';

  // Redirect to sign in page if the user is not authenticated.
  const redirectToSignIn =
    !redirectToInstallPage &&
    isAuthenticated === false &&
    pathname !== '/install-pwa' &&
    pathname !== '/about' &&
    pathname !== '/signin' &&
    pathname !== '/signin-as';

  useEffect(() => {
    (async () => {
      if (redirectToInstallPage) {
        console.log('Redirecting to install page');
        router.push('/about');
      } else if (redirectToSignIn) {
        console.log('Redirecting to sign in page');
        router.push('/signin');
      }
    })();
  }, [
    isPwa,
    router,
    isMobile,
    isAuthenticated,
    pathname,
    isUsernameSet,
    redirectToInstallPage,
    redirectToSignIn,
  ]);

  useEffect(() => {
    const localStoragePersister = createSyncStoragePersister({
      storage: window.localStorage,
    });

    persistQueryClient({
      queryClient,
      persister: localStoragePersister,
      buster: '5',
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

const WithPrivy = ({ children }: { children: React.ReactNode }) => {
  const { signInMethod } = useSignInMethod();

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={{
        loginMethods: signInMethod ? [signInMethod] : undefined,
        supportedChains: [getChain(), mainnet],
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
  );
};

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
      throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is not set');
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <SignInMethodContextProvider>
        <WithPrivy>{children}</WithPrivy>
      </SignInMethodContextProvider>
      <Toaster richColors expand></Toaster>
    </ThemeProvider>
  );
}
