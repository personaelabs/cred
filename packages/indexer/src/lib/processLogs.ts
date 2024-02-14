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

// Sync logs for a specific event.
export const processLogs = async <T extends Transport, C extends Chain>({
  client,
  event,
  fromBlock,
  processor,
  label,
  contractAddress,
  batchSize = BigInt(200000),
}: {
  client: PublicClient<T, C>; // Ethereum RPC client to use
  event: AbiEvent; // Event to process
  fromBlock: bigint; // Block number to start from
  processor: (logs: GetFilterLogsReturnType) => Promise<'terminate' | void>; // Function to process logs
  label: string;
  contractAddress: Hex;
  batchSize?: bigint; // How many blocks to process at a time
}): Promise<'terminate' | void> => {
  // Get the latest block number
  const latestBlock = await client.getBlockNumber();

  let adjustableBatchSize = batchSize;

  let exitCode;
  for (let batchFrom = fromBlock; batchFrom < latestBlock; ) {
    await retry(async () => {
      let toBlock = batchFrom + adjustableBatchSize - BigInt(1);

      let logs: GetLogsReturnType | null = null;
      while (logs === null) {
        try {
          logs = await client.getLogs({
            address: contractAddress,
            event,
            fromBlock: batchFrom,
            toBlock,
            strict: true,
          });
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

      exitCode = await processor(logs);

      batchFrom = toBlock + BigInt(1);
      adjustableBatchSize += adjustableBatchSize / BigInt(4);
    });

    if (exitCode === 'terminate') {
      break;
    }
  }

  if (exitCode === 'terminate') {
    return exitCode;
  }
};

export const parseERC20TransferLogs = (logs: GetFilterLogsReturnType) => {
  return logs.map(log => {
    // @ts-ignore
    const from = log.args.from;
    // @ts-ignore
    const to = log.args.to;
    // @ts-ignore
    const value = BigInt(log.args.value.toString());

    const logIndex = log.logIndex;
    const transactionIndex = log.transactionIndex;

    return {
      from: from.toLowerCase() as Hex,
      to: to.toLowerCase() as Hex,
      value,
      blockNumber: log.blockNumber,
      transactionIndex: transactionIndex,
      logIndex: logIndex,
    };
  });
};
