import { Contract, ContractType, ERC20TransferEvent } from '@prisma/client';
import prisma from '../../prisma';
import {
  GetFilterLogsReturnType,
  Hex,
  Chain,
  PublicClient,
  HttpTransport,
} from 'viem';
import { processLogs } from '../../lib/processLogs';
import { TRANSFER_EVENT } from './abi/abi';
import { runInParallel } from '../../utils';
import chalk from 'chalk';
import * as chains from 'viem/chains';

/**
 * Sync `Transfer` events from ERC20 contracts
 */
const indexTransferEvents = async (
  client: PublicClient<HttpTransport, Chain>,
  contract: Contract
) => {
  const label = `find latest event ${contract.id}`;
  console.time(label);
  const latestSyncedEvent = await prisma.eRC20TransferEvent.aggregate({
    _max: {
      blockNumber: true,
    },
    where: {
      contractId: contract.id,
    },
  });

  console.timeEnd(label);

  const fromBlock =
    latestSyncedEvent._max.blockNumber || BigInt(contract.deployedBlock);

  const processTransfers = async (logs: GetFilterLogsReturnType) => {
    const data = logs
      .map(log => {
        // @ts-ignore
        const from = log.args.from;
        // @ts-ignore
        const to = log.args.to;
        // @ts-ignore
        const value = log.args.value.toString();

        const logIndex = log.logIndex;
        const transactionIndex = log.transactionIndex;

        return {
          contractId: contract.id,
          from: from.toLowerCase() as Hex,
          to: to.toLowerCase() as Hex,
          value,
          blockNumber: log.blockNumber,
          transactionIndex: transactionIndex,
          logIndex: logIndex,
        };
      })
      .filter(data => data) as ERC20TransferEvent[];

    if (data.length > 0) {
      console.log(
        chalk.gray(`Writing ${data.length} events for ${contract.id}`)
      );
      const result = await prisma.eRC20TransferEvent.createMany({
        data,
        skipDuplicates: true,
      });
    }
  };

  await processLogs({
    client,
    event: TRANSFER_EVENT,
    fromBlock,
    processor: processTransfers,
    contract,
    batchSize: BigInt(200000),
  });
};

/**
 * Sync Transfer logs of ERC20 contracts stored in the database
 */
export const syncERC20 = async () => {
  // Get all ERC20 contracts to index from the database
  const contracts = await prisma.contract.findMany({
    where: {
      type: ContractType.ERC20,
    },
  });

  const jobs = contracts.map(contract => {
    // Get the `Chain` object that corresponds `contract.chain`
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

  // Sync the `Transfer` events for each contract in parallel
  await runInParallel(indexTransferEvents, jobs);
};
