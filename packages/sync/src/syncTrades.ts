import { baseSepolia } from 'viem/chains';
import { getChain, sleep } from './lib/utils';
import client from './lib/viemClient';
import {
  CRED_CONTRACT_ADDRESS as _CRED_CONTRACT_ADDRESS,
  CRED_SEPOLIA_CONTRACT_ADDRESS,
  tokenIdToRoomId,
} from '@cred/shared';
import { Hex, parseAbiItem, zeroAddress } from 'viem';
import {
  addReaderToRoom,
  getUserByAddress,
  removeUserFromRoom,
} from '@cred/firebase';

const chain = getChain();

const CRED_CONTRACT_ADDRESS =
  chain.id === baseSepolia.id
    ? CRED_SEPOLIA_CONTRACT_ADDRESS
    : _CRED_CONTRACT_ADDRESS;

const TRANSFER_SINGLE_EVENT = parseAbiItem(
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)'
);

const CRED_CONTRACT_DEPLOYED_BLOCK = BigInt(0);
const CRED_SEPOLIA_CONTRACT_DEPLOY_BLOCK = BigInt(10167164);

const syncTrades = async () => {
  const chunkSize = BigInt(1000);

  let synchedBlock =
    chain.id === baseSepolia.id
      ? CRED_SEPOLIA_CONTRACT_DEPLOY_BLOCK
      : CRED_CONTRACT_DEPLOYED_BLOCK;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const latestBlock = await client.getBlockNumber();
    console.log(`Synching from block ${synchedBlock} to ${latestBlock}`);

    for (let i = synchedBlock; i < latestBlock; ) {
      const fromBlock = i;
      const toBlock = i + chunkSize > latestBlock ? latestBlock : i + chunkSize;

      const logs = await client.getLogs({
        address: CRED_CONTRACT_ADDRESS,
        event: TRANSFER_SINGLE_EVENT,
        fromBlock,
        toBlock,
      });

      console.log(`Found ${logs.length} logs`);
      for (const log of logs) {
        const { from, to, id } = log.args;

        if (!to) {
          console.warn('No "to" to address found in log');
          continue;
        }

        if (!from) {
          console.warn('No "from" address found in log');
          continue;
        }

        if (!id) {
          console.warn('No id found in log');
          continue;
        }

        const toUser = await getUserByAddress(to.toLowerCase() as Hex);

        if (!toUser) {
          console.warn('toUser not found:', to);
          continue;
        }

        const roomId = tokenIdToRoomId(id);
        await addReaderToRoom({
          roomId,
          userId: toUser.id,
        });

        if (from !== zeroAddress) {
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

      i = toBlock;
      synchedBlock = toBlock;
    }

    await sleep(10000);
  }
};

export default syncTrades;
