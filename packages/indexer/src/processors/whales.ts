import { Hex } from 'viem';
import prisma from '../prisma';
import chalk from 'chalk';
import { Contract } from '@prisma/client';
import { saveTree } from '../lib/tree';
import Redis from 'ioredis';

const ioredis = new Redis();

const MINTER_ADDRESS = '0x0000000000000000000000000000000000000000';

export const getWhaleHandle = (contractName: string): string => {
  return `whale-${contractName.toLowerCase()}`;
};

const indexWhales = async (contract: Contract) => {
  const [, _maxBlock] = await ioredis.zrevrange(
    `${contract.id}:logs`,
    0,
    0,
    'WITHSCORES'
  );

  const maxBlock = Number(_maxBlock);

  let totalSupply = BigInt(0);

  let balances: Record<Hex, bigint> = {};

  const whales = new Set<Hex>();

  // Update the balances based on the logs
  const chunkSize = 20000;
  let from = Number(contract.deployedBlock);
  let to = from + chunkSize;

  while (true) {
    if (to > maxBlock) {
      break;
    }

    // Get logs for the range
    // const batchTo = batchFrom + chunkSize;
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
      if (!balances[log.to]) {
        balances[log.to] = BigInt(0);
      }

      balances[log.to] += BigInt(log.value);

      if (!balances[log.from]) {
        balances[log.from] = BigInt(0);
      }

      balances[log.from] -= BigInt(log.value);

      // Update the total supply
      if (log.from === MINTER_ADDRESS) {
        totalSupply += BigInt(log.value);
      }

      if (log.to === MINTER_ADDRESS) {
        totalSupply -= BigInt(log.value);
      }

      // If the `to` address has more than 0.1% of the total supply, add it to the whales
      if (balances[log.to] > totalSupply / BigInt(1000)) {
        // Add the whale to the group
        whales.add(log.to);
      }

      if (log.from !== MINTER_ADDRESS && balances[log.from] < BigInt(0)) {
        if (
          log.from !== '0x731c6f8c754fa404cfcc2ed8035ef79262f65702' &&
          log.from !== '0xf55037738604fddfc4043d12f25124e94d7d1780'
        ) {
          console.log(
            chalk.red(
              `Negative balance for ${log.from} in ${contract.name} (${contract.id})`
            )
          );
          return;
        }
      }
    }

    from = to;
    to += chunkSize;
  }

  const handle = getWhaleHandle(contract.name);

  const group = await prisma.group.findFirst({
    where: {
      handle,
    },
  });

  if (!group) {
    throw new Error(`Group not found for ${contract.name}`);
  }
  console.log(
    chalk.blue(
      `Found ${whales.size} $${contract.symbol?.toUpperCase()} (${contract.id}) whales`
    )
  );
  await saveTree({
    groupId: group.id,
    addresses: [...whales] as Hex[],
  });
};

export default indexWhales;
