import { app } from '@cred/firebase-admin';
import {
  PortalAbi,
  PORTAL_SEPOLIA_CONTRACT_ADDRESS,
  getRoomTokenId,
  roomConverter,
} from '@cred/shared';
import { getFirestore } from 'firebase-admin/firestore';
import { Hex, createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { getRandomElements, sleep, sleepForRandom } from './utils';
import { faker } from '@faker-js/faker';
import logger from './logger';

const db = getFirestore(app);

const { ALCHEMY_BASE_SEPOLIA_API_KEY, MONKEY_PRIV_KEY } = process.env;

if (!ALCHEMY_BASE_SEPOLIA_API_KEY) {
  throw new Error('ALCHEMY_BASE_SEPOLIA_API_KEY is required in development');
}

if (!MONKEY_PRIV_KEY) {
  throw new Error('MONKEY_PRIV_KEY is required in development');
}

const monkeyAccount = privateKeyToAccount(MONKEY_PRIV_KEY as Hex);

const client = createWalletClient({
  account: monkeyAccount,
  chain: baseSepolia,
  transport: http(
    `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_BASE_SEPOLIA_API_KEY}`
  ),
});

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(
    `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_BASE_SEPOLIA_API_KEY}`
  ),
});

const buyKeys = async ({
  roomId,
  numKeys,
}: {
  roomId: string;
  numKeys: bigint;
}) => {
  const tokenId = getRoomTokenId(roomId);

  const buyPrice = await publicClient.readContract({
    abi: PortalAbi,
    address: PORTAL_SEPOLIA_CONTRACT_ADDRESS,
    functionName: 'getBuyPrice',
    args: [tokenId, numKeys],
  });

  const fee = await publicClient.readContract({
    abi: PortalAbi,
    address: PORTAL_SEPOLIA_CONTRACT_ADDRESS,
    functionName: 'getProtocolFee',
    args: [buyPrice],
  });

  const totalCost = buyPrice + fee;

  const txHash = await client.writeContract({
    abi: PortalAbi,
    address: PORTAL_SEPOLIA_CONTRACT_ADDRESS,
    functionName: 'buyKeys',
    args: [monkeyAccount.address, tokenId, numKeys, '0x0'],
    value: totalCost,
  });

  logger.info(`Bought ${numKeys} keys for ${totalCost}`, {
    txHash,
    totalCost,
    roomId,
  });
};

export const startTradeMonkey = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const roomsRef = db.collection('rooms').withConverter(roomConverter);
    const rooms = (await roomsRef.get()).docs.map(doc => doc.data());

    // Determine which rooms to buy keys for
    const buyKeyOfRooms = getRandomElements(
      rooms.map(room => room.id),
      3
    );

    logger.debug(`Buying keys for ${buyKeyOfRooms.length} rooms`);

    const numKeys = faker.number.bigInt({ min: 1, max: 5 });

    // Buy keys for rooms
    for (const roomId of buyKeyOfRooms) {
      try {
        await buyKeys({ roomId, numKeys });
        await sleep(5000);
      } catch (error) {
        logger.error('Failed to buy keys', { roomId, error });
      }
    }

    await sleepForRandom({
      minMs: 60 * 15 * 1000, // 15 minutes
      maxMs: 60 * 60 * 1000, // 1 hour
    });
  }
};
