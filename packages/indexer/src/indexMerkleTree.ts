import prisma from './prisma';
import { IGNORE_CONTRACTS, getDevAddresses } from './utils';
import { Contract, Group } from '@prisma/client';
import indexWhales, { getWhaleHandle } from './processors/whales';
import indexEarlyHolders, {
  getEarlyHolderHandle,
} from './processors/earlyHolders';
import { saveTree } from './lib/tree';

// Run a sync job
const runSyncJob = async (args: {
  contract: Contract;
  targetGroup: string;
}) => {
  switch (args.targetGroup) {
    case 'whale':
      await indexWhales(args.contract);
      break;
    case 'earlyHolder':
      await indexEarlyHolders(args.contract);
      break;
    default:
      throw new Error(`Unknown target group ${args.targetGroup}`);
  }
};

// Create or update a group for a contract based on `targetGroup`
const upsertGroup = async (contract: Contract, targetGroup: string) => {
  let upsertData: Pick<Group, 'displayName' | 'handle' | 'type'>;
  console.log(`Upserting group for ${contract.name} ${targetGroup}`);

  if (targetGroup === 'whale') {
    const handle = getWhaleHandle(contract.name);

    upsertData = {
      type: 'whale',
      handle,
      displayName: `$${contract.symbol?.toUpperCase()} whale`,
    };
  } else if (targetGroup === 'earlyHolder') {
    const handle = getEarlyHolderHandle(contract.name);

    upsertData = {
      type: 'earlyHolder',
      handle,
      displayName: `Early $${contract.symbol?.toUpperCase()} holder`,
    };
  } else {
    throw new Error(`Unknown target group ${targetGroup}`);
  }

  await prisma.group.upsert({
    create: upsertData,
    update: upsertData,
    where: {
      handle: upsertData.handle,
    },
  });
};

const indexMerkleTree = async () => {
  if (process.env.NODE_ENV === 'production') {
    // await syncMemeTokensMeta();

    // Get all contracts
    const contracts = await prisma.contract.findMany({
      where: {
        symbol: {
          notIn: IGNORE_CONTRACTS,
        },
      },
    });

    // Create or update groups based on the `targetGroups` field of contracts
    for (const contract of contracts) {
      const groups = contract.targetGroups;

      for (const group of groups) {
        await upsertGroup(contract, group);
      }
    }

    const chunkSize = 30;

    for (let i = 0; i < contracts.length; i += chunkSize) {
      const chunk = contracts.slice(i, i + chunkSize);

      const promises = [];
      for (const contract of chunk) {
        for (const targetGroup of contract.targetGroups) {
          promises.push(runSyncJob({ contract, targetGroup }));
        }
      }

      await Promise.all(promises);
    }
  } else {
    // In development, only index the dev group

    const devGroupData = {
      handle: 'dev',
      displayName: 'Dev',
    };
    const devGroup = await prisma.group.upsert({
      create: devGroupData,
      update: devGroupData,
      where: {
        handle: devGroupData.handle,
      },
    });

    const addresses = getDevAddresses();
    console.log(
      `Indexing ${addresses.length} addresses for ${devGroup.displayName}`
    );

    await saveTree({ groupId: devGroup.id, addresses, blockNumber: BigInt(0) });
  }
};

indexMerkleTree();
