import { createPublicClient, http } from 'viem';
import { base, anvil } from 'viem/chains';

const NODE_ENV = process.env.NODE_ENV;
const ALCHEMY_BASE_API_KEY = process.env.ALCHEMY_BASE_API_KEY;

if (NODE_ENV !== 'development') {
  if (!ALCHEMY_BASE_API_KEY) {
    throw new Error('ALCHEMY_BASE_API_KEY is required in production');
  }
}

const transport =
  NODE_ENV === 'development'
    ? http()
    : http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_BASE_API_KEY}`);

const client = createPublicClient({
  chain: process.env.NODE_ENV === 'development' ? anvil : base,
  transport,
});

export default client;
