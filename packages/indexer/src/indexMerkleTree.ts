import { Chain, HttpTransport, PublicClient } from 'viem';
import prisma from './prisma';
import { getDevAddresses, runInParallel } from './utils';
import { Contract, Group } from '@prisma/client';
import * as chains from 'viem/chains';
import { syncMemeTokensMeta } from './providers/coingecko/coingecko';
import indexWhales, { getWhaleHandle } from './processors/whales';
import indexEarlyHolders, {
  getEarlyHolderHandle,
} from './processors/earlyHolders';
import chalk from 'chalk';
import { saveTree } from './lib/tree';

// Run a sync job
const runSyncJob = async (
  client: PublicClient<HttpTransport, Chain>,
  args: {
    contract: Contract;
    targetGroup: string;
  }
) => {
  switch (args.targetGroup) {
    case 'whale':
      await indexWhales(client, args.contract);
      break;
    case 'earlyHolder':
      console.log(
        chalk.gray(`indexing early holders for ${args.contract.name}`)
      );
      await indexEarlyHolders(client, args.contract);
      break;
    default:
      throw new Error(`Unknown target group ${args.targetGroup}`);
  }
};

// Create or update a group for a contract based on `targetGroup`
const upsertGroup = async (contract: Contract, targetGroup: string) => {
  let upsertData: Pick<Group, 'blockNumber' | 'handle' | 'displayName'>;
  console.log(`upserting group for ${contract.name} ${targetGroup}`);

  if (targetGroup === 'whale') {
    const handle = getWhaleHandle(contract.name);
    // Get the synched block number from the group if it exists
    const group = await prisma.group.findUnique({
      select: {
        blockNumber: true,
      },
      where: {
        handle,
      },
    });

    upsertData = {
      blockNumber: group?.blockNumber || contract.deployedBlock - BigInt(1),
      handle,
      displayName: `${contract.name} historical whale`,
    };
  } else if (targetGroup === 'earlyHolder') {
    const handle = getEarlyHolderHandle(contract.name);

    // Get the synched block number from the group if it exists
    const group = await prisma.group.findUnique({
      select: {
        blockNumber: true,
      },
      where: {
        handle,
      },
    });

    upsertData = {
      blockNumber: group?.blockNumber || contract.deployedBlock - BigInt(1),
      handle,
      displayName: `${contract.name} early holder`,
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
    await syncMemeTokensMeta();

    // Get all contracts
    const contracts = await prisma.contract.findMany();

    // Create or update groups based on the `targetGroups` field of contracts
    for (const contract of contracts) {
      const groups = contract.targetGroups;

      for (const group of groups) {
        await upsertGroup(contract, group);
      }
    }

    // Prepare a sync job for each group
    const jobs = contracts.flatMap(contract => {
      const chain = Object.values(chains).find(
        chain => chain.name === contract.chain
      );

      if (!chain) {
        throw new Error(`Chain ${contract.chain} not found`);
      }

      return contract.targetGroups.map(targetGroup => ({
        chain,
        args: {
          contract,
          targetGroup,
        },
      }));
    });

    // Run the sync jobs in parallel
    await runInParallel(runSyncJob, jobs);
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

    await saveTree({ groupId: devGroup.id, addresses });
  }
};

indexMerkleTree();
