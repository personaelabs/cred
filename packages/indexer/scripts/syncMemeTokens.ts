import 'dotenv/config';
import { ContractType } from '@prisma/client';
import prisma from '../src/prisma';
import { Hex } from 'viem';
import { getNextAvailableClient, releaseClient } from '../src/providers/ethRpc';
import * as chains from 'viem/chains';
import { getFirstLog } from '../src/lib/getFirstLog';
import { TRANSFER_EVENT } from '../src/providers/erc20/abi/abi';

const COINGECKO_API_ENDPOINT = 'https://pro-api.coingecko.com/api/v3/';

interface CoingeckoTokenResponse {
  id: string;
  detail_platforms: Record<
    string,
    {
      decimal_place: number;
      contract_address: Hex;
    }
  >;
  name: string;
  symbol: string;
}

/**
 * Get token information from CoinGecko by token id
 */
export const getTokenById = async (
  tokenId: string
): Promise<CoingeckoTokenResponse> => {
  const queryParams = {
    x_cg_pro_api_key: process.env.COINGECKO_API_KEY as string,
    localization: 'false',
    tickers: 'false',
    market_data: 'false',
    community_data: 'false',
    developer_data: 'false',
  };

  const queryString = new URLSearchParams(queryParams).toString();

  const url = `${COINGECKO_API_ENDPOINT}/coins/${tokenId}?${queryString}`;

  const result = await fetch(url);
  const data = await result.json();

  return data as CoingeckoTokenResponse;
};

/**
 * Get all meme token IDs from CoinGecko
 */
const getMemeTokens = async (): Promise<string[]> => {
  const queryParams = {
    category: 'meme-token',
    vs_currency: 'usd',
    x_cg_pro_api_key: process.env.COINGECKO_API_KEY as string,
    days: 'max',
    per_page: '100',
    order: 'market_cap_desc',
  };

  const queryString = new URLSearchParams(queryParams).toString();
  const url = `${COINGECKO_API_ENDPOINT}/coins/markets?${queryString}`;
  const data = await fetch(url);

  const tokensIds = (await data.json()).map(
    (token: any) => token.id
  ) as string[];
  return tokensIds;
};

/**
 * Sync metadata of meme tokes from CoinGecko
 */
export const syncMemeTokens = async () => {
  // Get all meme tokens ids
  const tokenIds = await getMemeTokens();

  console.log(`Processing ${tokenIds.length} meme tokens`);

  // Get all meme token contract addresses
  const tokens = [];
  for (const tokenId of tokenIds) {
    const token = await getTokenById(tokenId);
    tokens.push(token);
  }

  // Filter out tokens that are not on ethereum
  const processableTokens = tokens.filter(token => {
    {
      const platforms = Object.keys(token.detail_platforms);

      return platforms.some(platform => platform === 'ethereum');
    }
  });

  // Store tokens with deployed block numbers
  const tokensWithDeployedBlock: {
    contractAddress: Hex;
    deployedBlock: bigint;
    name: string;
    decimals: number;
    symbol: string;
    chain: string;
  }[] = [];

  // Number of tokens to sync
  const numTokens = 50;

  // Get the deployed block for each token
  for (const token of processableTokens.slice(0, numTokens)) {
    for (const platform of Object.keys(token.detail_platforms)) {
      if (platform !== 'ethereum') {
        continue;
      }

      const contractAddress = token.detail_platforms[platform].contract_address;
      const decimals = token.detail_platforms[platform].decimal_place;

      let chain: chains.Chain;
      if (platform === 'ethereum') {
        chain = chains.mainnet;
      } else {
        throw new Error(`Unknown platform ${platform}`);
      }

      const client = getNextAvailableClient(chain);

      if (!client) {
        throw new Error('No available clients');
      }

      // Get the first transfer event log
      const log = await getFirstLog({
        client: client.client,
        contractAddress,
        event: TRANSFER_EVENT,
      });

      // Use the block number of the first transfer event log as the deployed block
      const deployedBlock = log.blockNumber;

      // Release the client
      releaseClient(client);

      tokensWithDeployedBlock.push({
        contractAddress,
        name: token.name,
        symbol: token.symbol,
        deployedBlock,
        decimals,
        chain: chain.name,
      });
    }
  }

  // Save token contracts to the database
  for (const token of tokensWithDeployedBlock) {
    const data = {
      chain: token.chain,
      decimals: token.decimals,
      address: token.contractAddress,
      name: token.name,
      deployedBlock: token.deployedBlock,
      type: ContractType.ERC20,
      symbol: token.symbol,
      targetGroups: ['earlyHolder', 'whale'],
    };

    await prisma.contract.upsert({
      create: data,
      update: data,
      where: {
        address_chain: {
          address: token.contractAddress,
          chain: 'Ethereum',
        },
      },
    });
  }
};

syncMemeTokens();
