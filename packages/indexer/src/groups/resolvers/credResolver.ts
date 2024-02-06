import { Hex } from 'viem';
import prisma from '../../prisma';

/**
 * Get the first 5% of addresses to receive a transfer for each token
 */
const getEarlyHolders = async (): Promise<Hex[]> => {
  // Get all contracts with a coingecko id
  const contracts = await prisma.contract.findMany({
    select: {
      id: true,
    },
    where: {
      coingeckoId: {
        not: null,
      },
    },
  });

  const holders = new Set<Hex>();

  for (const contract of contracts) {
    // Get the total number of holders for the token
    const result = await prisma.$queryRaw<{ numHolders: bigint }[]>`
      SELECT COUNT(DISTINCT "to") as "numHolders" FROM "ERC20TransferEvent"
      WHERE "contractId" = ${contract.id}
    `;

    const numHolders = result[0].numHolders as bigint;

    // Get the 5% threshold as an absolute number
    const earlinessThreshold = Math.round(Number(numHolders) * 0.05);

    // Get the first 5% of holders
    const transfers = await prisma.eRC20TransferEvent.findMany({
      where: {
        contractId: contract.id,
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
  }

  return [...holders];
};

/**
 * Get addresses that have ever held over 0.1% of the total supply for each token
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
  for (const contract of contracts) {
    let holdings: { [key: string]: bigint } = {};
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

        if (!holdings[transfer.from]) {
          holdings[transfer.from] = BigInt(0);
        }

        if (!holdings[transfer.to]) {
          holdings[transfer.to] = BigInt(0);
        }

        holdings[transfer.from] -= BigInt(transfer.value);
        holdings[transfer.to] += BigInt(transfer.value);

        // Push to `largeHolders` if the holder has ever held more than 0.1% of the total supply
        if (holdings[transfer.to] > totalSupply / BigInt(1000)) {
          largeHolders.add(transfer.to as Hex);
        }
      }

      skip += batchSize;
      console.log(`Processed ${skip} transfers for ${contract.name}`);
    }

    const numHolders = Object.keys(holdings).filter(
      holder => holdings[holder] > 0
    ).length;
    console.log(`Total number of holders for ${contract.name}: ${numHolders}`);

    const topHolders = Object.entries(holdings)
      .sort((a, b) => (b[1] > a[1] ? 1 : -1))
      .slice(0, 10);

    console.log(`Top 10 holders for ${contract.name}:`);
    console.log(topHolders.map(holder => `${holder[0]}: ${holder[1]}`));
  }

  return [...largeHolders];
};

const getQualifiedAddresses = async () => {
  const earlyHolders = await getEarlyHolders();
  const topHolders = await getTopHoldersAcrossTime();

  return [...new Set([...topHolders, ...earlyHolders])];
};

export default getQualifiedAddresses;
