import { baseSepolia } from 'viem/chains';
import { getChain, sleep } from './lib/utils';
import client from './lib/viemClient';
import {
  PORTAL_CONTRACT_ADDRESS as _PORTAL_CONTRACT_ADDRESS,
  PORTAL_CONTRACT_DEPLOYED_BLOCK as _PORTAL_CONTRACT_DEPLOYED_BLOCK,
  PORTAL_SEPOLIA_CONTRACT_ADDRESS,
  PORTAL_SEPOLIA_CONTRACT_DEPLOY_BLOCK,
  PortalAbi,
  tokenIdToRoomId,
} from '@cred/shared';
import { Hex, parseAbiItem, zeroAddress } from 'viem';
import {
  addReaderToRoom,
  getUserByAddress,
  removeUserFromRoom,
} from '@cred/firebase-admin';
import logger from './lib/logger';

const chain = getChain();

const PORTAL_CONTRACT_ADDRESS =
  chain.id === baseSepolia.id
    ? PORTAL_SEPOLIA_CONTRACT_ADDRESS
    : _PORTAL_CONTRACT_ADDRESS;

const PORTAL_CONTRACT_DEPLOYED_BLOCK =
  chain.id === baseSepolia.id
    ? PORTAL_SEPOLIA_CONTRACT_DEPLOY_BLOCK
    : _PORTAL_CONTRACT_DEPLOYED_BLOCK;

const TRANSFER_SINGLE_EVENT = parseAbiItem(
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)'
);

const getBalance = async ({
  address,
  tokenId,
}: {
  address: Hex;
  tokenId: bigint;
}) => {
  const balance = await client.readContract({
    abi: PortalAbi,
    address: PORTAL_CONTRACT_ADDRESS,
    functionName: 'balanceOf',
    args: [address, tokenId],
  });

  return balance;
};

const syncTrades = async () => {
  const chunkSize = BigInt(1000);

  let synchedBlock = PORTAL_CONTRACT_DEPLOYED_BLOCK;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const latestBlock = await client.getBlockNumber();
    logger.info(`Synching from block ${synchedBlock} to ${latestBlock}`);

    for (let i = synchedBlock; i < latestBlock; ) {
      const fromBlock = i;
      const toBlock = i + chunkSize > latestBlock ? latestBlock : i + chunkSize;

      const logs = await client.getLogs({
        address: PORTAL_CONTRACT_ADDRESS,
        event: TRANSFER_SINGLE_EVENT,
        fromBlock,
        toBlock,
      });

      logger.info(`Found logs`, {
        fromBlock,
        toBlock,
        logs: logs.length,
      });

      for (const log of logs) {
        const { from, to, id } = log.args;

        if (!to) {
          logger.error('No "to" to address found in log');
          continue;
        }

        if (!from) {
          logger.error('No "from" address found in log');
          continue;
        }

        if (!id) {
          logger.error('No id found in log');
          continue;
        }

        const roomId = tokenIdToRoomId(id);

        if (to !== zeroAddress) {
          const toUser = await getUserByAddress(to.toLowerCase() as Hex);

          if (!toUser) {
            logger.warn('toUser not found:', to);
            continue;
          }

          await addReaderToRoom({
            roomId,
            userId: toUser.id,
          });
        }

        if (from !== zeroAddress) {
          const balance = await getBalance({
            address: from,
            tokenId: id,
          });

          if (balance === BigInt(0)) {
            const fromUser = await getUserByAddress(from.toLowerCase() as Hex);

            if (!fromUser) {
              console.warn('fromUser not found:', from);
              continue;
            }

            await removeUserFromRoom({
              roomId,
              userId: fromUser.id,
            });
          }
        }
      }

      i = toBlock;
      synchedBlock = toBlock;
    }

    await sleep(10000);
  }
};

export default syncTrades;
