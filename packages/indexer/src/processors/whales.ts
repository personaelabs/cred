import { Hex } from 'viem';
import prisma from '../prisma';
import chalk from 'chalk';
import { Contract } from '@prisma/client';
import { saveTree } from '../lib/tree';
import Redis from 'ioredis';
import { ERC20TransferEvent } from '../proto/transfer_event_pb';

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
  let whaleThreshold = BigInt(0);

  const balances: Record<Hex, bigint> = {};

  const whales = new Set<Hex>();

  // Update the balances based on the logs
  const chunkSize = 200000;
  let from = Number(contract.deployedBlock);
  let to = from + chunkSize;

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
      if (!balances[log.to]) {
        balances[log.to] = BigInt(log.value);
      } else {
        balances[log.to] += BigInt(log.value);
      }

      if (!balances[log.from]) {
        balances[log.from] = BigInt(0);
      }

      if (log.from !== MINTER_ADDRESS) {
        balances[log.from] -= BigInt(log.value);
      }

      // Update the total supply
      if (log.from === MINTER_ADDRESS) {
        totalSupply += BigInt(log.value);
        whaleThreshold = totalSupply / BigInt(1000);
      }

      if (log.to === MINTER_ADDRESS) {
        totalSupply -= BigInt(log.value);
        whaleThreshold = totalSupply / BigInt(1000);
      }

      // If the `to` address has more than 0.1% of the total supply, add it to the whales
      if (balances[log.to] > whaleThreshold) {
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
