'use client';
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import MobileFooter from '@/components/MobileFooter';
import { Toaster } from '@/components/ui/sonner';
import { UserProvider } from '@/context/UserContext';
import DesktopFooter from '@/components/DesktopFooter';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import '@farcaster/auth-kit/styles.css';
import { AuthKitProvider } from '@farcaster/auth-kit';
import Header from '@/components/Header';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { mainnet } from 'viem/chains';
import { MediaQueryProvider } from '@/context/MediaQueryContext';

const queryClient = new QueryClient();

const wagmicConfig = getDefaultConfig({
  appName: 'creddd',
  projectId: '2ea91e648a2198845fee3ea267ff37dc',
  chains: [mainnet],
  ssr: true,
});

const config = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'creddd.xyz',
  siweUri: 'http://creddd.xyz/login',
  relay: 'https://relay.farcaster.xyz',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <script
          defer
          data-domain="creddd.xyz"
          src="https://plausible.io/js/script.js"
        ></script>
      </head>
      <body className="bg-background overflow-y-hidden">
        <WagmiProvider config={wagmicConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider modalSize="wide">
              <TooltipProvider>
                <MediaQueryProvider>
                  <UserProvider>
                    <AuthKitProvider config={config}>
                      <ThemeProvider attribute="class" defaultTheme="dark">
                        <Header></Header>
                        <div className="flex flex-row justify-center w-full">
                          <div className="w-full flex flex-col">{children}</div>
                        </div>
                        <MobileFooter></MobileFooter>
                        <DesktopFooter></DesktopFooter>
                      </ThemeProvider>
                    </AuthKitProvider>
                  </UserProvider>
                </MediaQueryProvider>
              </TooltipProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
        <Toaster richColors expand></Toaster>
      </body>
    </html>
  );
}
