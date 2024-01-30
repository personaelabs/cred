'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { WagmiConfig, configureChains, createConfig, mainnet } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultWallets,
} from '@rainbow-me/rainbowkit';

const { chains, publicClient } = configureChains([mainnet], [publicProvider()]);

const { connectors } = getDefaultWallets({
  appName: 'Nouns Nymz',
  projectId: '564add972ca30e293482fd9361543d69',
  chains,
});

const appConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export default function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiConfig config={appConfig}>
      <RainbowKitProvider
        chains={chains}
        theme={darkTheme({
          accentColor: '#FDA174',
          accentColorForeground: 'white',
          fontStack: 'rounded',
          overlayBlur: 'large',
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
