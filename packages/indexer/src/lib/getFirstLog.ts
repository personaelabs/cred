import { Hex, HttpTransport, PublicClient } from 'viem';
import { AbiEvent } from 'abitype';
import * as chains from 'viem/chains';

// Get the first log of a specific event.
// It fetches logs in batches from the genesis block until it finds the first log.
export const getFirstLog = async ({
  client,
  contractAddress,
  event,
}: {
  client: PublicClient<HttpTransport, chains.Chain>; // Ethereum RPC client to use
  event: AbiEvent; // Event to process
  contractAddress: Hex; // Contract address
}) => {
  let batchFrom = BigInt(0);
  let batchSize = BigInt(3000000);

  let toBlock = batchFrom + batchSize;

  let logs = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // Fetch event logs
      logs = await client.getLogs({
        address: contractAddress,
        event,
        fromBlock: batchFrom,
        toBlock,
        strict: true,
      });

      batchFrom += batchSize;
      toBlock = batchFrom + batchSize;
    } catch (err: any) {
      if (err.details.includes('Log response size exceeded')) {
        // Reduce the batch size and retry
        batchSize = batchSize / BigInt(2);
        toBlock = batchFrom + batchSize;
      } else {
        throw err;
      }
    }

    if (logs && logs.length > 0) {
      break;
    }
  }

  return logs[0];
};
