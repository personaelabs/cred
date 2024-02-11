import 'dotenv/config';
import {
  createPublicClient,
  http,
  Chain,
  PublicClient,
  HttpTransport,
} from 'viem';
import * as chains from 'viem/chains';
import { ManagedClient } from '../types';

const NUM_MAINNET_CLIENTS = 10;

const getClient = (
  chain: Chain,
  clientIndex: number = 0
): PublicClient<HttpTransport, chains.Chain> => {
  let apiKey;
  let subdomain;
  switch (chain) {
    case chains.mainnet:
      switch (clientIndex) {
        case 0:
          apiKey = process.env.ALCHEMY_API_KEY_0;
          break;
        case 1:
          apiKey = process.env.ALCHEMY_API_KEY_1;
          break;
        case 2:
          apiKey = process.env.ALCHEMY_API_KEY_2;
          break;
        case 3:
          apiKey = process.env.ALCHEMY_API_KEY_3;
          break;
        case 4:
          apiKey = process.env.ALCHEMY_API_KEY_4;
          break;
        case 5:
          apiKey = process.env.ALCHEMY_API_KEY_5;
          break;
        case 6:
          apiKey = process.env.ALCHEMY_API_KEY_6;
          break;
        case 7:
          apiKey = process.env.ALCHEMY_API_KEY_7;
          break;
        case 8:
          apiKey = process.env.ALCHEMY_API_KEY_8;
          break;
        case 9:
          apiKey = process.env.ALCHEMY_API_KEY_9;
          break;
        default:
          throw new Error('Invalid client index');
      }
      subdomain = 'eth-mainnet';
      break;
    // For non-mainnet chains,
    // return the same API key for all client indices for now
    case chains.optimism:
      apiKey = process.env.ALCHEMY_OPT_API_KEY;
      subdomain = 'opt-mainnet';
      break;
    case chains.base:
      apiKey = process.env.ALCHEMY_BASE_API_KEY;
      subdomain = 'base-mainnet';
      break;
    case chains.arbitrum:
      apiKey = process.env.ALCHEMY_ARB_API_KEY;
      subdomain = 'arb-mainnet';
      break;
    default:
      throw new Error('Invalid chain');
  }

  return createPublicClient({
    chain,
    transport: http(`https://${subdomain}.g.alchemy.com/v2/${apiKey}`),
  });
};

/**
 * Manage a list of occupied Ethereum RPC clients as a global variable
 */
let occupiedClients: {
  [chainId: string]: number[];
} = {
  [chains.mainnet.id.toString()]: [],
  [chains.optimism.id.toString()]: [],
  [chains.base.id.toString()]: [],
  [chains.arbitrum.id.toString()]: [],
};

/**
 * List of all clients for each chain
 */
const allClientIds = {
  [chains.mainnet.id.toString()]: Array.from({ length: 10 }, (_, i) => i),
  [chains.optimism.id.toString()]: Array.from({ length: 5 }, (_, i) => i),
  [chains.base.id.toString()]: Array.from({ length: 5 }, (_, i) => i),
  [chains.arbitrum.id.toString()]: Array.from({ length: 5 }, (_, i) => i),
};

export const getNextAvailableClient = (chain: Chain): ManagedClient | null => {
  const chainId = chain.id.toString();

  // Get all clients for the chain
  const chainAllClients = allClientIds[chainId];

  // Get the list of active clients for the chain
  const chainOccupiedClients = occupiedClients[chainId];

  const nextAvailableClientId = chainAllClients.find(
    clientId => !chainOccupiedClients.includes(clientId)
  );

  // If there are no available clients, return null
  if (nextAvailableClientId === undefined) {
    return null;
  }

  // Add the client to the list of active clients
  occupiedClients[chainId].push(nextAvailableClientId);

  return {
    client: getClient(chain, nextAvailableClientId),
    id: nextAvailableClientId,
  };
};

export const releaseClient = (client: ManagedClient) => {
  // Get the chain ID from the client
  const chainId = client.client.chain.id.toString();

  // Remove the client from the list of active clients
  occupiedClients[chainId] = occupiedClients[chainId].filter(
    clientId => clientId !== client.id
  );
};
