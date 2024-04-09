import { Chain, createPublicClient, http } from 'viem';
import * as chains from 'viem/chains';
const {
  ALCHEMY_API_KEY_0,
  ALCHEMY_BASE_API_KEY,
  ALCHEMY_OPT_API_KEY,
  ALCHEMY_ARB_API_KEY,
} = process.env;

const mainnetClient = createPublicClient({
  transport: http(
    `https://eth-mainnet.g.alchemy.com/v2/<apiKey>/${ALCHEMY_API_KEY_0}`
  ),
});

const optClient = createPublicClient({
  transport: http(
    `https://opt-mainnet.g.alchemy.com/v2/<apiKey>/${ALCHEMY_OPT_API_KEY}`
  ),
});

const arbClient = createPublicClient({
  transport: http(
    `https://arb-mainnet.g.alchemy.com/v2/<apiKey>/${ALCHEMY_ARB_API_KEY}`
  ),
});

const baseClient = createPublicClient({
  transport: http(
    `https://base-mainnet.g.alchemy.com/v2/<apiKey>/${ALCHEMY_BASE_API_KEY}`
  ),
});

export const getClient = (chain: Chain) => {
  switch (chain) {
    case chains.mainnet:
      return mainnetClient;
    case chains.optimism:
      return optClient;
    case chains.arbitrum:
      return arbClient;
    case chains.base:
      return baseClient;
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
};
