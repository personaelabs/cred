'use client';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthKitProvider } from '@farcaster/auth-kit';
import MobileFooter from '@/components/MobileFooter';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import {
  HeaderContextProvider,
  useHeaderOptions,
} from '@/contexts/HeaderContext';
import MobileHeader from '@/components/MobileHeader';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isNotificationConfigured } from '@/lib/notification';
import useSignedInUser from '@/hooks/useSignedInUser';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { WagmiProvider, useSetActiveWallet } from '@privy-io/wagmi';
import useIsPwa from '@/hooks/useIsPwa';
import wagmiConfig from '@/lib/wagmiConfig';
import { FooterContextProvider } from '@/contexts/FooterContext';
import {
  MediaQueryProvider,
  useMediaQuery,
} from '@/contexts/MediaQueryContext';
import Image from 'next/image';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import theme from '@/lib/theme';
import { base, baseSepolia } from 'viem/chains';
import { getChain } from '@/lib/utils';

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

const config = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'creddd.xyz',
  siweUri: 'http://creddd.xyz/login',
  relay: 'https://relay.farcaster.xyz',
};

const HEADER_HEIGHT = 60;

const Main = ({ children }: { children: React.ReactNode }) => {
  const { height } = useWindowDimensions();
  const { options } = useHeaderOptions();
  const pathname = usePathname();
  const router = useRouter();
  const { data: signedInUser } = useSignedInUser();
  const isPwa = useIsPwa();
  const { isModalOpen } = usePrivy();

  const hideFooter =
    ['/signin', '/install-pwa'].includes(pathname) ||
    pathname.startsWith('/rooms/') ||
    isModalOpen;

  console.log('hideFooter', hideFooter);

  const { isMobile } = useMediaQuery();

  useEffect(() => {
    if (isPwa === false) {
      router.push('/install-pwa');
    }

    if (signedInUser && isPwa === true) {
      if (!isNotificationConfigured()) {
        router.replace('/enable-notifications');
      }
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

  const { ready: walletsReady, wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  useEffect(() => {
    if (walletsReady && signedInUser) {
      const embeddedWallet = wallets.find(
        wallet => wallet.walletClientType === 'privy'
      );
      if (embeddedWallet) {
        console.log('Setting active wallet', embeddedWallet);
        setActiveWallet(embeddedWallet);
      }
    }
  }, [walletsReady, wallets, setActiveWallet, signedInUser]);

  if (!isMobile) {
    return (
      <div className="h-[100vh] bg-background flex flex-col items-center justify-center">
        <Image
          src="/personae-logo.svg"
          alt="Personae logo"
          width={100}
          height={100}
        ></Image>
        <div className="mt-4 text-2xl">
          Please access this page on a mobile device
        </div>
      </div>
    );
  }

  const footerHeight = hideFooter ? 0 : 70;

  return (
    <div className="h-full">
      <MobileHeader
        title={options.title}
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
  );
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <PrivyProvider
        appId="clw1tqoyj02yh110vokuu7yc5"
        config={{
          defaultChain: getChain(),
          supportedChains: [baseSepolia, base],
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
            <TooltipProvider>
              <AuthKitProvider config={config}>
                <MediaQueryProvider>
                  <HeaderContextProvider>
                    <FooterContextProvider>
                      <Main>{children}</Main>
                    </FooterContextProvider>
                  </HeaderContextProvider>
                </MediaQueryProvider>
              </AuthKitProvider>
            </TooltipProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
      <Toaster richColors expand></Toaster>
    </ThemeProvider>
  );
}
