import { WagmiConfig, createConfig, mainnet, configureChains } from 'wagmi';
import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { publicProvider } from 'wagmi/providers/public';
import Script from 'next/script';

const { chains, publicClient } = configureChains([mainnet], [publicProvider()]);

// Using the  WalletConnect Cloud project from Noun Nyms for now
const { connectors } = getDefaultWallets({
  appName: 'Nouns Nymz',
  projectId: '564add972ca30e293482fd9361543d69',
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
          <Component {...pageProps} />
        </RainbowKitProvider>
      </WagmiConfig>
    </>
  );
}
