import { anvil, base, baseSepolia } from 'wagmi/chains';
import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { getChain } from './utils';

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

const ANVIL_CONFIG = createConfig({
  chains: [anvil],
  transports: {
    [anvil.id]: http('http://localhost:8545'),
  },
});

const chain = getChain();
const config =
  chain.id === anvil.id
    ? ANVIL_CONFIG
    : chain.id === baseSepolia.id
      ? SEPOLIA_CONFIG
      : MAINNET_CONFIG;

export default config;
