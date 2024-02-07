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
import { Contract, ContractType, ERC721TransferEvent } from '@prisma/client';
import * as chains from 'viem/chains';

export const getERC721Owners = async (contractId: number): Promise<Hex[]> => {
  const result = await prisma.$queryRaw<{ address: Hex }[]>`
      WITH partitioned AS (
        SELECT
            *,
            ROW_NUMBER() OVER (PARTITION BY "tokenId" ORDER BY "blockNumber" DESC, "transactionIndex" DESC) AS row_number
        FROM
            "ERC721TransferEvent"
        WHERE
            "tokenId" in( SELECT DISTINCT
                "tokenId" FROM "ERC721TransferEvent"
            WHERE
                "contractId" = ${contractId})
        AND "contractId" = ${contractId}
      )
        SELECT
            "to" AS "address"
        FROM
            partitioned
        WHERE
            row_number = 1
    `;

  return result.map(({ address }) => address);
};

const indexTransferEvents = async (
  client: PublicClient<HttpTransport, Chain>,
  contract: Contract
) => {
  const latestSyncedEvent = await prisma.eRC721TransferEvent.aggregate({
    _max: {
      blockNumber: true,
    },
    where: {
      contractId: contract.id,
    },
  });

  const fromBlock =
    latestSyncedEvent?._max.blockNumber || BigInt(contract.deployedBlock);

  const processTransfers = async (logs: GetFilterLogsReturnType) => {
    const data = logs.map(log => {
      // @ts-ignore
      const from = log.args.from;
      // @ts-ignore
      const to = log.args.to;
      // @ts-ignore
      const tokenId = log.args.tokenId;

      const transactionIndex = log.transactionIndex;
      const logIndex = log.logIndex;

      return {
        contractId: contract.id,
        from: from.toLowerCase() as Hex,
        to: to.toLowerCase() as Hex,
        tokenId: tokenId,
        blockNumber: log.blockNumber,
        transactionIndex: transactionIndex,
        logIndex: logIndex,
      } as ERC721TransferEvent;
    });

    if (data.length > 0) {
      await prisma.eRC721TransferEvent.createMany({
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

export const syncERC721 = async () => {
  const contracts = await prisma.contract.findMany({
    where: {
      type: ContractType.ERC721,
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
