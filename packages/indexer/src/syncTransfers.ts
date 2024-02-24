import {
  Chain,
  GetLogsReturnType,
  Hex,
  HttpTransport,
  PublicClient,
  toBytes,
} from 'viem';
import prisma from './prisma';
import { IGNORE_CONTRACTS, runInParallel, sleep } from './utils';
import { Contract } from '@prisma/client';
import * as chains from 'viem/chains';
import { parseERC20TransferLogs, processLogs } from './lib/processLogs';
import { TRANSFER_EVENT } from './providers/erc20/abi/abi';
import { ERC20TransferEvent } from './proto/transfer_event_pb';
import * as rocksdb from './rocksdb';

const saveLogs = async (logs: GetLogsReturnType, contract: Contract) => {
  const parsedLogs = parseERC20TransferLogs(logs);

  const data = [];
  for (const log of parsedLogs) {
    const transferEvent = new ERC20TransferEvent();

    transferEvent.setFrom(toBytes(log.from));
    transferEvent.setTo(toBytes(log.to));
    transferEvent.setValue(toBytes(log.value));

    const bytes = Buffer.from(transferEvent.serializeBinary());
    const key = Buffer.alloc(26);
    key.writeUint16BE(contract.id, 0);
    key.writeBigUInt64BE(log.blockNumber, 2);
    key.writeUint32BE(log.transactionIndex, 10);
    key.writeUint32BE(log.logIndex, 18);

    data.push({
      key,
      value: bytes,
    });
  }

  if (data.length > 0) {
    console.time(`putBatch ${contract.symbol}`);
    await rocksdb.putBatch(data);
    console.timeEnd(`putBatch ${contract.symbol}`);
  }
};

const getBlockNumFromKey = (key: Buffer) => {
  return BigInt(key.readBigUInt64BE(2));
};

const getContractIdFromKey = (key: Buffer) => {
  return key.readUInt16BE(0);
};

const runSyncJob = async (
  client: PublicClient<HttpTransport, Chain>,
  contract: Contract
) => {
  const iterator = rocksdb.db.iterator({
    reverse: true,
  });

  // To find the record of the latest block that has been synched for this contract,
  // we need to iterate in reverse from a key that is greater than the contract id.
  const prefix = Buffer.alloc(2);
  prefix.writeUint16BE(contract.id + 1, 0);
  iterator.seek(prefix);

  const latestBlock: bigint | null = await new Promise((resolve, reject) => {
    function next() {
      iterator.next((err, key, _value) => {
        if (err) {
          reject(err);
          return;
        }

        if (!key) {
          // No more records
          resolve(null);
          return;
        }

        const contractId = getContractIdFromKey(key as Buffer);
        if (contractId === contract.id) {
          resolve(getBlockNumFromKey(key as Buffer));
          return;
        } else if (contractId < contract.id) {
          // Contract not found
          resolve(null);
          return;
        }

        // Keep iterating
        next();
      });
    }
    next();
  });

  const fromBlock = latestBlock || contract.deployedBlock;

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
};

rocksdb.open().then(async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await syncTransfers();
    await sleep(1000 * 5 * 60); // 5 minutes
  }
});
