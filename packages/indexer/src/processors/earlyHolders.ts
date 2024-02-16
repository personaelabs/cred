import { Hex } from 'viem';
import prisma from '../prisma';
import chalk from 'chalk';
import { Contract } from '@prisma/client';
import { saveTree } from '../lib/tree';
import Redis from 'ioredis';

const ioredis = new Redis();

export const getEarlyHolderHandle = (contractName: string): string => {
  return `early-holder-${contractName.toLowerCase()}`;
};

const indexEarlyHolders = async (contract: Contract) => {
  const handle = getEarlyHolderHandle(contract.name);

  const uniqueHolders = new Set<Hex>();
  const holders: Hex[] = [];

  const chunkSize = 1000;
  let from = Number(contract.deployedBlock);
  let to = from + chunkSize;

  const [, _maxBlock] = await ioredis.zrevrange(
    `${contract.id}:logs`,
    0,
    0,
    'WITHSCORES'
  );

  const maxBlock = Number(_maxBlock);

  while (true) {
    if (to > maxBlock) {
      break;
    }

    const logs = await ioredis.zrangebyscore(
      `${contract.id}:logs`,
      from,
      to - 1,
      'WITHSCORES'
    );

    const parsedLogs = [];
    for (let i = 0; i < logs.length; i += 2) {
      const parsedLog = JSON.parse(logs[i]);
      const blockNumber = Number(logs[i + 1]);

      parsedLogs.push({
        ...parsedLog,
        blockNumber,
      });
    }

    const sortedLogs = parsedLogs.sort(
      (a, b) =>
        a.blockNumber - b.blockNumber ||
        a.transactionIndex - b.transactionIndex ||
        a.logIndex - b.logIndex
    );

    for (const log of sortedLogs) {
      if (!uniqueHolders.has(log.to)) {
        holders.push(log.to);
      }

      uniqueHolders.add(log.to);
    }

    from = to;
    to += chunkSize;
  }

  const totalHolders = uniqueHolders.size;

  const earlinessThreshold = Math.round(totalHolders * 0.05);

  const earlyHolders = holders.slice(0, earlinessThreshold);

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

  console.log(
    chalk.blue(
      `Found ${earlyHolders.length} early $${contract.symbol?.toUpperCase()} (${contract.id}) holders`
    )
  );
  await saveTree({
    groupId: group.id,
    addresses: earlyHolders,
  });
};
export default indexEarlyHolders;
