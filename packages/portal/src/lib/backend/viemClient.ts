import { createPublicClient, http } from 'viem';
import { anvil, base, baseSepolia } from 'viem/chains';
import { getChain } from '../utils';

const chain = getChain();

const ALCHEMY_BASE_API_KEY = process.env.ALCHEMY_BASE_API_KEY;
const ALCHEMY_BASE_SEPOLIA_API_KEY = process.env.ALCHEMY_BASE_SEPOLIA_API_KEY;

if (chain.id === baseSepolia.id && !ALCHEMY_BASE_SEPOLIA_API_KEY) {
  throw new Error('ALCHEMY_BASE_SEPOLIA_API_KEY is required in development');
}

if (chain.id === base.id && !ALCHEMY_BASE_API_KEY) {
  throw new Error('ALCHEMY_BASE_API_KEY is required in production');
}

const transport =
  chain.id === anvil.id
    ? http('http://127.0.0.1:8545')
    : chain.id === baseSepolia.id
      ? http(
          `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_BASE_SEPOLIA_API_KEY}`
        )
      : http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_BASE_API_KEY}`);

const client = createPublicClient({
  chain,
  transport,
});

export default client;
