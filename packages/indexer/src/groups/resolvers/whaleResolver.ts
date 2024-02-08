import { Hex } from 'viem';
import prisma from '../../prisma';
import { GroupSpec } from '../../types';

const MINTER_ADDRESS = '0x0000000000000000000000000000000000000000';

const saveTotalSupply = async ({
  contractId,
  totalSupply,
  blockNumber,
}: {
  contractId: number;
  totalSupply: bigint;
  blockNumber: bigint;
}): Promise<void> => {
  const totalSupplyRecord = {
    contractId,
    totalSupply: totalSupply.toString(),
    blockNumber: blockNumber,
  };

  await prisma.eRC20TotalSupply.upsert({
    where: {
      contractId,
    },
    create: totalSupplyRecord,
    update: totalSupplyRecord,
  });
};

/**
 * Get the total supply synched to the database for the given token
 */
const getSynchedTotalSupply = async (
  contractId: number
): Promise<bigint | null> => {
  const totalSupplyRecord = await prisma.eRC20TotalSupply.findUnique({
    select: {
      totalSupply: true,
    },
    where: {
      contractId,
    },
  });

  return totalSupplyRecord ? BigInt(totalSupplyRecord.totalSupply) : null;
};

/**
 * Get addresses that have ever held over 0.1% of the total supply for the given token
 */
const getTopHoldersAcrossTime = async ({
  contractId,
  groupHandle,
}: {
  contractId: number;
  groupHandle: string;
}): Promise<Hex[]> => {
  const group = await prisma.group.findUnique({
    where: {
      handle: groupHandle,
    },
  });

  // Get the existing Merkle tree of large holders from the database.
  // The addresses in this tree will be merged with new large holders.
  const latestMerkleTree = group
    ? await prisma.merkleTree.findFirst({
        select: {
          merkleProofs: {
            select: {
              address: true,
            },
          },
        },
        where: {
          groupId: group.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    : null;

  const largeHolders = new Set<Hex>();

  // Add existing large holders to `largeHolders`
  if (latestMerkleTree) {
    for (const proof of latestMerkleTree.merkleProofs) {
      largeHolders.add(proof.address as Hex);
    }
  }

  // Get saved balances from the database
  const savedBalances = await prisma.eRC20Balance.findMany({
    select: {
      address: true,
      balance: true,
      blockNumber: true,
    },
    where: {
      contractId,
    },
    orderBy: {
      blockNumber: 'desc',
    },
  });

  // Get the block number to start updating balances from
  const fromBlock =
    savedBalances.length > 0 ? savedBalances[0].blockNumber : BigInt(0);

  // Track balances
  let balances: {
    [key: string]: {
      balance: bigint;
      blockNumber: bigint;
      updated: boolean;
    };
  } = {};

  // Assign balances from the database
  for (const balance of savedBalances) {
    balances[balance.address] = {
      balance: BigInt(balance.balance),
      blockNumber: balance.blockNumber,
      updated: false,
    };
  }

  // Track total supply
  let totalSupply = (await getSynchedTotalSupply(contractId)) || BigInt(0);

  const batchSize = 100000;
  let skip = 0;
  let hasNextPage = true;
  let latestTransferBlockNumber = fromBlock;
  while (hasNextPage) {
    console.time('getTransfers');
    let transfers = await prisma.eRC20TransferEvent.findMany({
      select: {
        from: true,
        to: true,
        value: true,
        blockNumber: true,
      },
      where: {
        contractId,
        blockNumber: {
          gt: fromBlock,
        },
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
    console.timeEnd('getTransfers');

    hasNextPage = transfers.length > batchSize;
    transfers = transfers.slice(0, batchSize);

    if (transfers.length > 0) {
      latestTransferBlockNumber = transfers[transfers.length - 1].blockNumber;
    }

    for (const transfer of transfers) {
      if (transfer.from === MINTER_ADDRESS) {
        totalSupply += BigInt(transfer.value);
      }

      if (!balances[transfer.from]) {
        balances[transfer.from] = {
          balance: BigInt(0),
          blockNumber: transfer.blockNumber,
          updated: true,
        };
      }

      if (!balances[transfer.to]) {
        balances[transfer.to] = {
          balance: BigInt(0),
          blockNumber: transfer.blockNumber,
          updated: true,
        };
      }

      balances[transfer.from].balance -= BigInt(transfer.value);
      balances[transfer.to].balance += BigInt(transfer.value);

      balances[transfer.from].blockNumber = transfer.blockNumber;
      balances[transfer.to].blockNumber = transfer.blockNumber;

      balances[transfer.from].updated = true;
      balances[transfer.to].updated = true;

      // Push to `largeHolders` if the holder has ever held more than 0.1% of the total supply
      if (balances[transfer.to].balance > totalSupply / BigInt(1000)) {
        largeHolders.add(transfer.to as Hex);
      }

      // Sanity check for negative balances
      if (
        transfer.from !== MINTER_ADDRESS &&
        balances[transfer.from].balance < BigInt(0)
      ) {
        throw new Error(`Negative balance for ${transfer.from}`);
      }
    }

    console.log(
      `Processed ${transfers.length + skip} transfers for ${contractId}`
    );
    skip += batchSize;
  }

  // Save total supply to the database
  await saveTotalSupply({
    contractId,
    totalSupply,
    blockNumber: latestTransferBlockNumber,
  });

  if (savedBalances.length === 0) {
    // Initialize balances in db if they don't exist
    console.log(`Initializing balances for ${contractId}`);
    const balanceCreateMany = Object.entries(balances).map(
      ([address, balance]) => {
        return {
          address,
          balance: balance.balance.toString(),
          contractId,
          blockNumber: balance.blockNumber,
        };
      }
    );

    await prisma.eRC20Balance.createMany({
      data: balanceCreateMany,
    });
  } else {
    // Update balances in db if they have changed

    const updatedBalances = Object.entries(balances).filter(
      ([_, balance]) => balance.updated
    );

    console.log(
      `Updating ${updatedBalances.length} balances for ${contractId}`
    );

    // Update balances in db
    for (const [address, balance] of updatedBalances) {
      const data = {
        balance: balance.balance.toString(),
        blockNumber: balance.blockNumber,
      };
      await prisma.eRC20Balance.upsert({
        where: {
          contractId_address: {
            address: address,
            contractId,
          },
        },
        create: {
          address,
          contractId,
          ...data,
        },
        update: data,
      });
    }
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
    const handle = `${contract.name.toLowerCase()}-whale`;
    return {
      group: {
        handle,
        displayName: `Whale ${contract.name} Holder`,
      },
      resolveMembers: () => {
        return getTopHoldersAcrossTime({
          contractId: contract.id,
          groupHandle: handle,
        });
      },
    };
  });

  return groups;
};

export default whaleGroupsResolver;
