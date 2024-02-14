import fs from 'fs';
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
import { parseERC20TransferLogs, processLogs } from '../lib/processLogs';
import { TRANSFER_EVENT } from '../providers/erc20/abi/abi';
import { saveTree } from '../lib/tree';
import Redis from 'ioredis';

const ioredis = new Redis();

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export const getWhaleHandle = (contractName: string): string => {
  return `whale-${contractName.toLowerCase()}`;
};

const getSynchedBlockKey = (handle: string) => {
  return `synched_${handle}`;
};

const getTotalSupplyKey = (contractId: number) => {
  return `${contractId}_total_supply`;
};

const MINTER_ADDRESS = '0x0000000000000000000000000000000000000000';

const indexWhalesFromLogs = async (
  contract: Contract,
  logs: GetFilterLogsReturnType
): Promise<'terminate' | void> => {
  const contractId = contract.id;
  const parsedLogs = parseERC20TransferLogs(logs);

  // Get the total supply of the token from Redis
  let totalSupply = BigInt(
    (await ioredis.get(getTotalSupplyKey(contract.id))) || '0'
  );

  // Get the addresses touched by the logs
  const touchedAddressesSet = new Set<string>();
  for (const log of parsedLogs) {
    touchedAddressesSet.add(log.to);
    touchedAddressesSet.add(log.from);
  }
  const touchedAddresses = [...touchedAddressesSet];

  let balances: Record<Hex, bigint> = {};

  // Get the balances for the touched addresses from Redis
  const values =
    touchedAddresses.length > 0
      ? await ioredis.mget(
          touchedAddresses.map(address => `${contractId}_${address}`)
        )
      : [];

  // Set balances of touched addresses to the `balances` object
  for (let i = 0; i < touchedAddresses.length; i++) {
    const address = touchedAddresses[i];
    balances[address as Hex] =
      values[i] !== null ? BigInt(values[i] as string) : BigInt(0);
  }

  const newWhales = new Set<Hex>();
  // Update the balances based on the logs
  for (const log of parsedLogs) {
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

    // If the `to` address has more than 0.1% of the total supply, add it to the whales
    if (balances[log.to] > totalSupply / BigInt(1000)) {
      // Add the whale to the group
      newWhales.add(log.to);
    }

    if (log.from !== MINTER_ADDRESS && balances[log.from] < BigInt(0)) {
      await ioredis.set(`${contractId}_negative_balance`, 'true');
      const keysToDelete = await ioredis.keys(`${contractId}_0x*`);

      // Add the synched block key to the keys to delete
      keysToDelete.push(getSynchedBlockKey(getWhaleHandle(contract.name)));

      console.error(
        `Negative balance for ${log.from} in ${contract.name} (${contract.id})`
      );
      console.log(`Deleting ${keysToDelete.length} records from ${contractId}`);

      // Delete all balances for this contract
      if (keysToDelete.length > 0) {
        await ioredis.del(keysToDelete);
      }

      return 'terminate';
    }
  }

  // Save the whales to Redis
  for (const whale of [...newWhales]) {
    await ioredis.sadd(`${contractId}_whales`, whale);
  }

  // Prepare the mapping(address -> balance) to mset
  const data = new Map();
  Object.entries(balances).map(([address, balance]) =>
    data.set(`${contractId}_${address}`, balance.toString())
  );

  const handle = getWhaleHandle(contract.name);
  if (data.size > 0) {
    // Set the synched block number
    const syncStatusKey = getSynchedBlockKey(handle);
    data.set(syncStatusKey, logs[logs.length - 1].blockNumber.toString());

    // Save the total supply to Redis
    data.set(getTotalSupplyKey(contract.id), totalSupply.toString());

    // mset the balances, synched block number, and total supply atomically
    await ioredis.mset(data);
  }
};

const indexWhales = async (
  client: PublicClient<HttpTransport, Chain>,
  contract: Contract
) => {
  const handle = getWhaleHandle(contract.name);
  const syncStatusKey = getSynchedBlockKey(handle);
  const groupSynchedBlock = await ioredis.get(syncStatusKey);

  const fromBlock = groupSynchedBlock
    ? BigInt(groupSynchedBlock) + BigInt(1)
    : contract.deployedBlock;

  console.log(
    chalk.gray(`Indexing whales for ${contract.name} from block ${fromBlock}`)
  );

  const exitCode = await processLogs({
    client,
    event: TRANSFER_EVENT,
    contractAddress: contract.address as Hex,
    label: handle,
    fromBlock,
    processor: async (logs: GetFilterLogsReturnType) => {
      return await indexWhalesFromLogs(contract, logs);
    },
  });

  if (exitCode === 'terminate') {
    console.error(`Terminating indexing whales for ${contract.name} `);
    return;
  }

  const group = await prisma.group.findFirst({
    where: {
      handle,
    },
  });

  if (!group) {
    throw new Error(`Group not found for ${contract.name}`);
  }

  const whales = await ioredis.smembers(`${contract.id}_whales`);

  await saveTree({
    groupId: group.id,
    addresses: whales as Hex[],
  });

  console.log(
    chalk.gray(`Indexed ${whales.length} whales for ${contract.name}`)
  );
};

export default indexWhales;
