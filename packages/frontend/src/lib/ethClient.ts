import { Chain, Hex, createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as chains from 'viem/chains';
const {
  ALCHEMY_API_KEY_0,
  ALCHEMY_BASE_API_KEY,
  ALCHEMY_OPT_API_KEY,
  ALCHEMY_ARB_API_KEY,
} = process.env;

const MAINNET_RPC_URL = `https://eth-mainnet.g.alchemy.com/v2/<apiKey>/${ALCHEMY_API_KEY_0}`;
const OP_MAINNET_RPC_URL = `https://opt-mainnet.g.alchemy.com/v2/<apiKey>/${ALCHEMY_OPT_API_KEY}`;
const ARB_MAINNET_RPC_URL = `https://arb-mainnet.g.alchemy.com/v2/<apiKey>/${ALCHEMY_ARB_API_KEY}`;
const BASE_MAINNET_RPC_URL = `https://base-mainnet.g.alchemy.com/v2/<apiKey>/${ALCHEMY_BASE_API_KEY}`;

const { RESKIN_PRIV_KEY } = process.env;

if (!RESKIN_PRIV_KEY) {
  throw new Error('RESKIN_PRIV_KEY not set');
}

const account = privateKeyToAccount(RESKIN_PRIV_KEY as Hex);

/**
 * Returns the RPC URL for the given chain.
 */
const getRpcUrl = (chain: Chain) => {
  switch (chain) {
    case chains.mainnet:
      return MAINNET_RPC_URL;
    case chains.optimism:
      return OP_MAINNET_RPC_URL;
    case chains.arbitrum:
      return ARB_MAINNET_RPC_URL;
    case chains.base:
      return BASE_MAINNET_RPC_URL;
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
};

export const getPublicClient = (chain: Chain) => {
  const url = getRpcUrl(chain);

  return createPublicClient({
    transport: http(url),
  });
};

export const getWalletClient = (chain: Chain) => {
  const url = getRpcUrl(chain);

  return createWalletClient({
    account,
    transport: http(url),
  });
};
