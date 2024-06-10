import { base, baseSepolia } from 'wagmi/chains';
import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';

const MAINNET_CONFIG = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(
      'https://base-mainnet.g.alchemy.com/v2/kqG9cMzXHk97ry7Gcl53sWhbJ8iyEPcV'
    ),
  },
});

const SEPOLIA_CONFIG = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(
      `https://base-sepolia.g.alchemy.com/v2/BjrzZCLjdOu3etOMvJrm6HV63zBtxIjA`
    ),
  },
});

const config =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_CHAIN === 'sepolia'
    ? SEPOLIA_CONFIG
    : MAINNET_CONFIG;

export default config;
