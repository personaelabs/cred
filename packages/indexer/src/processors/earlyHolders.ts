import {
  Chain,
  GetFilterLogsReturnType,
  Hex,
  HttpTransport,
  PublicClient,
} from 'viem';
import prisma from '../prisma';
import chalk from 'chalk';
import { Contract } from '@prisma/client';
import { processLogs } from '../lib/processLogs';
import { TRANSFER_EVENT } from '../providers/erc20/abi/abi';
import { updateSyncStatus } from '../utils';
import { saveTree } from '../lib/tree';

export const getEarlyHolderHandle = (contractName: string): string => {
  return `early-holder-${contractName.toLowerCase()}`;
};

const updateEarlyHoldersFromLogs = async (
  contract: Contract,
  logs: GetFilterLogsReturnType
) => {
  const contractId = contract.id;
  const latestHolderPositionRecord = await prisma.eRC20HolderPosition.findFirst(
    {
      select: {
        position: true,
      },
      where: {
        contractId,
      },
      orderBy: {
        position: 'desc',
      },
    }
  );

  const latestHolderPosition = latestHolderPositionRecord
    ? latestHolderPositionRecord.position
    : 0;

  const newHolders = logs
    // @ts-ignore
    .map(log => log.args.to.toLowerCase() as Hex);

  // Add new holders to the database
  await prisma.eRC20HolderPosition.createMany({
    data: newHolders.map((address, i) => {
      return {
        contractId,
        position: latestHolderPosition + (i + 1),
        address,
      };
    }),
    skipDuplicates: true,
  });

  const handle = getEarlyHolderHandle(contract.name);

  // Update the synched block number of the group
  if (logs.length > 0) {
    await updateSyncStatus({
      groupHandle: handle,
      blockNumber: logs[logs.length - 1].blockNumber,
    });
  }
};

const indexEarlyHolders = async (
  client: PublicClient<HttpTransport, Chain>,
  contract: Contract
) => {
  const handle = getEarlyHolderHandle(contract.name);
  const group = await prisma.group.findUnique({
    select: {
      id: true,
      blockNumber: true,
    },
    where: {
      handle,
    },
  });

  if (!group) {
    throw new Error(`Group ${handle} not found`);
  }

  const fromBlock = group.blockNumber || contract.deployedBlock;

  await processLogs({
    client,
    event: TRANSFER_EVENT,
    fromBlock,
    contractAddress: contract.address as Hex,
    label: handle,
    processor: async (logs: GetFilterLogsReturnType) => {
      await updateEarlyHoldersFromLogs(contract, logs);
    },
  });

  const lastPositionRecord = await prisma.eRC20HolderPosition.findFirst({
    select: {
      position: true,
    },
    where: {
      contractId: contract.id,
    },
    orderBy: {
      position: 'desc',
    },
  });

  if (lastPositionRecord) {
    const totalHolders = lastPositionRecord.position;
    const earlinessThreshold = Math.round(totalHolders * 0.05);

    const earlyHolders = await prisma.eRC20HolderPosition.findMany({
      select: {
        address: true,
      },
      where: {
        contractId: contract.id,
        position: {
          lte: earlinessThreshold,
        },
      },
    });

    console.log(
      chalk.green(
        `Found ${earlyHolders.length} early holders for ${contract.name}`
      )
    );

    await saveTree({
      groupId: group.id,
      addresses: earlyHolders.map(h => h.address as Hex),
    });
  } else {
    console.log(chalk.gray(`No early holders found for ${contract.name}`));
  }
};
export default indexEarlyHolders;
