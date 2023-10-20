import { WagmiConfig, createConfig, mainnet, configureChains } from 'wagmi';
import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { publicProvider } from 'wagmi/providers/public';
import Script from 'next/script';
import Head from 'next/head';
import { Header } from '@/components/Header';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const { chains, publicClient } = configureChains([mainnet], [publicProvider()]);

// Using the  WalletConnect Cloud project from Noun Nyms for now
const { connectors } = getDefaultWallets({
  appName: 'creddd',
  projectId: '2ea91e648a2198845fee3ea267ff37dc',
  chains,
});

const config = createConfig({
  autoConnect: true,
  publicClient,
  connectors,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script
        defer
        data-domain="cred-frontend.vercel.app"
        src="https://plausible.io/js/script.js"
      ></Script>
      <WagmiConfig config={config}>
        <RainbowKitProvider chains={chains}>
          <Header></Header>
          <Head>
            <link type="favicon" rel="icon" href="/personae.ico" />
          </Head>
          <TooltipProvider delayDuration={50}>
            <div className="md:px-0 md:py-6">
              <div className="mb-4 flex justify-center">
                <Component {...pageProps} />
                <Toaster />
              </div>
            </div>
          </TooltipProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </>
  );
}
