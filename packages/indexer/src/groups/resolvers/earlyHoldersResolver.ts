import { Hex } from 'viem';
import prisma from '../../prisma';
import { GroupSpec } from '../../types';

/**
 * Get the first 5% of addresses to receive a transfer for each token
 */
const getEarlyHolders = async (contractId: number): Promise<Hex[]> => {
  console.log(`Getting early holders for contract ${contractId}`);
  const holders = new Set<Hex>();

  // For each token, get the first 5% of holders
  // Get the total number of holders for the token
  const result = await prisma.$queryRaw<{ numHolders: bigint }[]>`
      SELECT COUNT(DISTINCT "to") as "numHolders" FROM "ERC20TransferEvent"
      WHERE "contractId" = ${contractId}
    `;

  const numHolders = result[0].numHolders as bigint;

  // Get the 5% threshold as an absolute number
  const earlinessThreshold = Math.round(Number(numHolders) * 0.05);

  // Get the first 5% of holders
  const transfers = await prisma.eRC20TransferEvent.findMany({
    where: {
      contractId,
    },
    distinct: ['to'],
    orderBy: [
      {
        blockNumber: 'asc',
      },
      {
        transactionIndex: 'asc',
      },
      {
        logIndex: 'asc',
      },
    ],
    take: earlinessThreshold,
  });

  for (const transfer of transfers) {
    holders.add(transfer.to as Hex);
  }

  return [...holders];
};

/**
 * Get addresses that have ever held over 0.1% of the total supply for each token
 * *Unused for now
 */
const getTopHoldersAcrossTime = async (): Promise<Hex[]> => {
  const contracts = await prisma.contract.findMany({
    where: {
      coingeckoId: {
        not: null,
      },
    },
  });

  const largeHolders = new Set<Hex>();
  // For each token, get addresses that have ever held over 0.1% of the total supply
  for (const contract of contracts) {
    // Track balances
    let balances: { [key: string]: bigint } = {};

    // Track total supply
    let totalSupply = BigInt(0);

    const batchSize = 10000;
    let skip = 0;
    let hasNextPage = true;
    while (hasNextPage) {
      let transfers = await prisma.eRC20TransferEvent.findMany({
        select: {
          from: true,
          to: true,
          value: true,
        },
        where: {
          contractId: contract.id,
        },
        orderBy: [
          {
            blockNumber: 'asc',
          },
          {
            transactionIndex: 'asc',
          },
          {
            logIndex: 'asc',
          },
        ],
        take: batchSize + 1,
        skip,
      });

      hasNextPage = transfers.length > batchSize;
      transfers = transfers.slice(0, batchSize);

      for (const transfer of transfers) {
        if (transfer.from === '0x0000000000000000000000000000000000000000') {
          totalSupply += BigInt(transfer.value);
        }

        if (!balances[transfer.from]) {
          balances[transfer.from] = BigInt(0);
        }

        if (!balances[transfer.to]) {
          balances[transfer.to] = BigInt(0);
        }

        balances[transfer.from] -= BigInt(transfer.value);
        balances[transfer.to] += BigInt(transfer.value);

        // Push to `largeHolders` if the holder has ever held more than 0.1% of the total supply
        if (balances[transfer.to] > totalSupply / BigInt(1000)) {
          largeHolders.add(transfer.to as Hex);
        }
      }

      skip += batchSize;
      console.log(`Processed ${skip} transfers for ${contract.name}`);
    }
  }

  return [...largeHolders];
};

/**
 * Return a group of early holders per token
 */
const earlyHolderGroupsResolver = async (): Promise<GroupSpec[]> => {
  // Get all tokens with a coingeckoId
  const contracts = await prisma.contract.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      coingeckoId: {
        not: null,
      },
    },
  });

  // Assign metadata and members resolver for each token
  const groups = contracts.map(contract => {
    return {
      group: {
        handle: `early-${contract.name}`,
        displayName: `Early ${contract.name} Holder`,
        logo: '',
        requirements: ['First 5% of addresses to receive a transfer'],
      },
      resolveMembers: () => {
        return getEarlyHolders(contract.id);
      },
    };
  });

  return groups;
};

export default earlyHolderGroupsResolver;
