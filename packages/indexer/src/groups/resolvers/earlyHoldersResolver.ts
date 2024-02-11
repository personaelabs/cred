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

  const earlyHolders = new Set<Hex>();
  let page = 0;
  const chunkSize = 1000;
  while (earlyHolders.size < earlinessThreshold) {
    const chunk = await prisma.eRC20TransferEvent.findMany({
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
      skip: page * chunkSize,
    });

    chunk.forEach(transfer => {
      if (earlyHolders.size < earlinessThreshold) {
        earlyHolders.add(transfer.to as Hex);
      }
    });

    page++;
  }

  return [...earlyHolders];
};

export default getEarlyHolders;
