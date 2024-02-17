import {
  Chain,
  GetLogsReturnType,
  Hex,
  HttpTransport,
  PublicClient,
  toBytes,
} from 'viem';
import prisma from './prisma';
import { IGNORE_CONTRACTS, runInParallel } from './utils';
import { Contract } from '@prisma/client';
import * as chains from 'viem/chains';
import { parseERC20TransferLogs, processLogs } from './lib/processLogs';
import { TRANSFER_EVENT } from './providers/erc20/abi/abi';
import { ERC20TransferEvent } from './proto/transfer_event_pb';
import ioredis from './redis';

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const saveLogs = async (logs: GetLogsReturnType, contract: Contract) => {
  const parsedLogs = parseERC20TransferLogs(logs);

  const data = [];
  for (const log of parsedLogs) {
    const score = log.blockNumber.toString();
    const transferEvent = new ERC20TransferEvent();

    transferEvent.setFrom(toBytes(log.from));
    transferEvent.setTo(toBytes(log.to));
    transferEvent.setValue(toBytes(log.value));
    transferEvent.setLogindex(log.logIndex);
    transferEvent.setTransactionindex(log.transactionIndex);
    transferEvent.setBlocknumber(Number(log.blockNumber));

    data.push(score);
    const bytes = Buffer.from(transferEvent.serializeBinary());
    data.push(bytes);
  }

  if (data.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      ioredis.zadd(`${contract.id}:logs`, ...chunk);
    }
  }
};

const runSyncJob = async (
  client: PublicClient<HttpTransport, Chain>,
  contract: Contract
) => {
  const [_, synchedBlock] = await ioredis.zrevrange(
    `${contract.id}:logs`,
    0,
    0,
    'WITHSCORES'
  );

  const fromBlock = synchedBlock
    ? BigInt(synchedBlock)
    : contract.deployedBlock;

  console.log(
    `syncing transfers for ${contract.symbol} from block ${fromBlock}`
  );

  console.time(`Synched transfers for ${contract.symbol}`);
  await processLogs({
    client,
    event: TRANSFER_EVENT,
    fromBlock,
    processor: async (logs: GetLogsReturnType) => {
      await saveLogs(logs, contract);
    },
    contractAddress: contract.address as Hex,
  });
  console.timeEnd(`Synched transfers for ${contract.symbol}`);
};

const syncTransfers = async () => {
  // Get all contracts
  const contracts = await prisma.contract.findMany({
    where: {
      symbol: {
        notIn: IGNORE_CONTRACTS,
      },
    },
  });

  // Prepare a sync job for each group
  const jobs = contracts.flatMap(contract => {
    const chain = Object.values(chains).find(
      chain => chain.name === contract.chain
    );

    if (!chain) {
      throw new Error(`Chain ${contract.chain} not found`);
    }

    return {
      chain,
      args: contract,
    };
  });

  // Run the sync jobs in parallel
  await runInParallel(runSyncJob, jobs);

  await ioredis.quit();
};

syncTransfers();
