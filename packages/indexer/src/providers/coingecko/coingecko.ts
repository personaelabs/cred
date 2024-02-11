import { ContractType } from '@prisma/client';
import prisma from '../../prisma';
import { Hex } from 'viem';
import { getNextAvailableClient, releaseClient } from '../ethRpc';
import * as chains from 'viem/chains';
import { getFirstLog } from '../../lib/getFirstLog';
import { TRANSFER_EVENT } from '../erc20/abi/abi';

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
export const syncMemeTokensMeta = async () => {
  // Get all meme tokens ids
  const tokenIds = await getMemeTokens();

  // Get all meme tokens that are already synched
  const synchedTokens = await prisma.contract.findMany({
    select: {
      coingeckoId: true,
    },
    where: {
      coingeckoId: {
        not: null,
      },
    },
  });

  const synchedTokenIds = synchedTokens.map(token => token.coingeckoId);

  // Filter out meme tokens that are already synched
  const tokenIdsToSync = tokenIds.filter(
    tokenId => !synchedTokenIds.includes(tokenId)
  );

  console.log(`Processing ${tokenIdsToSync.length} meme tokens`);

  // Get all meme token contract addresses
  const tokens = [];
  for (const tokenId of tokenIdsToSync) {
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
    coinGeckoId: string;
    contractAddress: Hex;
    deployedBlock: bigint;
    name: string;
    decimals: number;
    chain: string;
  }[] = [];

  // Number of tokens to sync
  const numTokens = 50;

  const numSynchedTokens = synchedTokenIds.length;
  if (numSynchedTokens + processableTokens.length < numTokens) {
    throw new Error(
      `Not enough meme tokens to process. Expected at least ${numTokens}, got ${numSynchedTokens + processableTokens.length}`
    );
  }

  // Get the deployed block for each token
  for (const token of processableTokens.slice(
    0,
    numTokens - numSynchedTokens
  )) {
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
        coinGeckoId: token.id,
        contractAddress,
        name: token.name,
        deployedBlock,
        decimals,
        chain: chain.name,
      });
    }
  }

  // Save token contracts to the database
  await prisma.contract.createMany({
    data: tokensWithDeployedBlock.map(token => ({
      chain: token.chain,
      coingeckoId: token.coinGeckoId,
      decimals: token.decimals,
      address: token.contractAddress,
      name: token.name,
      deployedBlock: token.deployedBlock,
      type: ContractType.ERC20,
    })),
    skipDuplicates: true,
  });

  // Get all contracts from the database.
  // We need to get the auto-generated ids of the contracts.
  const contracts = await prisma.contract.findMany({
    where: {
      coingeckoId: { not: null },
    },
  });

  // Create a `Group` object for each contract
  for (const contract of contracts) {
    // Build groups with specs
    const groupsWithSpecs = [
      {
        group: {
          handle: `early-${contract.name.toLowerCase()}-holder`,
          displayName: `Early ${contract.name} holder`,
        },
        groupContractSpecs: [
          {
            contractId: contract.id,
            rules: ['earlyHolder'],
          },
        ],
      },
      {
        group: {
          handle: `whale-${contract.name.toLowerCase()}-holder`,
          displayName: `Whale ${contract.name} holder`,
        },
        groupContractSpecs: [
          {
            contractId: contract.id,
            rules: ['whale'],
          },
        ],
      },
    ];

    for (const groupWithSpec of groupsWithSpecs) {
      // Save the group to the database
      const group = await prisma.group.upsert({
        where: {
          handle: groupWithSpec.group.handle,
        },
        create: groupWithSpec.group,
        update: groupWithSpec.group,
      });

      // Save group contract specs to the database
      await prisma.groupContractSpec.createMany({
        data: groupWithSpec.groupContractSpecs.map(spec => ({
          groupId: group.id,
          contractId: contract.id,
          rules: spec.rules,
        })),
        skipDuplicates: true,
      });
    }
  }
};
