import { Hex } from 'viem';
import prisma from '../prisma';
import chalk from 'chalk';
import { Contract } from '@prisma/client';
import { saveTree } from '../lib/tree';
import Redis from 'ioredis';
import { ERC20TransferEvent } from '../proto/transfer_event_pb';

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

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (to > maxBlock) {
      break;
    }

    const logs = await ioredis.zrangebyscoreBuffer(
      `${contract.id}:logs`,
      from,
      to - 1
    );

    const parsedLogs = [];
    for (const log of logs) {
      const parsedLog = ERC20TransferEvent.deserializeBinary(log);

      const from =
        `0x${Buffer.from(parsedLog.getFrom_asU8()).toString('hex')}` as Hex;
      const to =
        `0x${Buffer.from(parsedLog.getTo_asU8()).toString('hex')}` as Hex;
      const value = BigInt(
        `0x${Buffer.from(parsedLog.getValue_asU8()).toString('hex')}`
      );

      parsedLogs.push({
        blockNumber: parsedLog.getBlocknumber(),
        transactionIndex: parsedLog.getTransactionindex(),
        logIndex: parsedLog.getLogindex(),
        from,
        to,
        value,
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
