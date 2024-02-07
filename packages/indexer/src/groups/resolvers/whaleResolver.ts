import { Hex } from 'viem';
import prisma from '../../prisma';
import { GroupSpec } from '../../types';

/**
 * Get addresses that have ever held over 0.1% of the total supply for the given token
 */
const getTopHoldersAcrossTime = async (contractId: number): Promise<Hex[]> => {
  const largeHolders = new Set<Hex>();
  // For each token, get addresses that have ever held over 0.1% of the total supply
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
        contractId,
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
    console.log(`Processed ${skip} transfers for ${contractId}`);
  }

  return [...largeHolders];
};

/**
 * Return all whale groups
 */
const whaleGroupsResolver = async (): Promise<GroupSpec[]> => {
  // Get all tokens that have targetGroup = 'whale'
  const contracts = await prisma.contract.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      targetGroups: {
        has: 'whale',
      },
    },
  });

  // Assign metadata and the `resolveMembers` function for each token
  const groups = contracts.map(contract => {
    return {
      group: {
        handle: `${contract.name}-whale`,
        displayName: `Whale ${contract.name} Holder`,
      },
      resolveMembers: () => {
        return getTopHoldersAcrossTime(contract.id);
      },
    };
  });

  return groups;
};

export default whaleGroupsResolver;
