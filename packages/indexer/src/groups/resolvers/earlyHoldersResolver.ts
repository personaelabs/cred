import { Hex } from 'viem';
import prisma from '../../prisma';
import { GroupSpec } from '../../types';

/**
 * Get the first 5% of addresses to receive a transfer for the given token
 */
const getEarlyHolders = async (contractId: number): Promise<Hex[]> => {
  console.log(`Getting early holders for contract ${contractId}`);

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
    select: {
      to: true,
    },
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

  return transfers.map(transfer => transfer.to as Hex);
};

/**
 * Return all early holders groups
 */
const earlyHolderGroupsResolver = async (): Promise<GroupSpec[]> => {
  // Get all tokens that have targetGroup = 'earlyHolder'
  const contracts = await prisma.contract.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      targetGroups: {
        has: 'earlyHolder',
      },
    },
  });

  // Assign metadata and the `resolveMembers` function for each token
  const groups = contracts.map(contract => {
    return {
      group: {
        handle: `early-${contract.name}`,
        displayName: `Early ${contract.name} Holder`,
      },
      resolveMembers: () => {
        return getEarlyHolders(contract.id);
      },
    };
  });

  return groups;
};

export default earlyHolderGroupsResolver;
