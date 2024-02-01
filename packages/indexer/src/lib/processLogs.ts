import {
  Chain,
  GetFilterLogsReturnType,
  GetLogsReturnType,
  Hex,
  PublicClient,
  Transport,
} from 'viem';
import { AbiEvent } from 'abitype';
import { retry } from '../utils';
import { Contract } from '@prisma/client';

// Sync logs for a specific event.
export const processLogs = async <T extends Transport, C extends Chain>({
  client,
  event,
  fromBlock,
  processor,
  contract,
  batchSize = BigInt(2000),
  accumulateLogs,
}: {
  client: PublicClient<T, C>; // Ethereum RPC client to use
  event: AbiEvent; // Event to process
  fromBlock: bigint; // Block number to start from
  processor: (
    logs: GetFilterLogsReturnType,
    args?: {
      fromBlock: bigint;
      toBlock: bigint;
    }
  ) => Promise<void>; // Function to process logs
  contract: Contract;
  batchSize?: bigint; // How many blocks to process at a time
  accumulateLogs?: number; // If set, will accumulate logs and process them in batches
}) => {
  // Get the latest block number
  const latestBlock = await client.getBlockNumber();
  let adjustableBatchSize = batchSize;

  let batch: GetLogsReturnType = [];
  for (let batchFrom = fromBlock; batchFrom < latestBlock; ) {
    let start = Date.now();
    await retry(async () => {
      let toBlock = batchFrom + adjustableBatchSize;

      // Fetch event logs
      let logs: GetLogsReturnType | null = null;
      while (logs === null) {
        try {
          logs = await client.getLogs({
            address: contract.address as Hex,
            event,
            fromBlock: batchFrom,
            toBlock,
            strict: true,
          });
          adjustableBatchSize *= BigInt(2);
        } catch (err: any) {
          if (err.details.includes('Log response size exceeded')) {
            // Reduce the batch size and retry
            adjustableBatchSize = adjustableBatchSize / BigInt(2);
            toBlock = batchFrom + adjustableBatchSize;
          } else {
            throw err;
          }
        }
      }

      // Now we know the logs are not null
      logs = logs as GetLogsReturnType;

      // If we're accumulating logs, push them to the batch
      if (accumulateLogs) {
        batch.push(...logs);
      }

      if (accumulateLogs) {
        if (batch.length >= accumulateLogs) {
          // If we've accumulated enough logs, process them
          await processor(batch, {
            fromBlock: batchFrom,
            toBlock,
          });

          batch = [];
        }
      } else {
        // If we're not accumulating logs, process them immediately
        await processor(logs, {
          fromBlock: batchFrom,
          toBlock,
        });
      }

      const blocksPerSec =
        Number(toBlock - batchFrom) / ((Date.now() - start) / 1000);
      console.log(`${blocksPerSec} bps`);

      batchFrom += adjustableBatchSize;
    });
  }
};
