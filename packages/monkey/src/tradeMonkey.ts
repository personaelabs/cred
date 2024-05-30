import { app } from '@cred/firebase';
import {
  logger,
  CredAbi,
  CRED_SEPOLIA_CONTRACT_ADDRESS,
  getRoomTokenId,
  roomConverter,
} from '@cred/shared';
import { getFirestore } from 'firebase-admin/firestore';
import { Hex, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { getRandomElements, sleepForRandom } from './utils';

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

const buyKeys = async ({
  roomId,
  numKeys,
}: {
  roomId: string;
  numKeys: number;
}) => {
  const tokenId = getRoomTokenId(roomId);
  const txHash = await client.writeContract({
    abi: CredAbi,
    address: CRED_SEPOLIA_CONTRACT_ADDRESS,
    functionName: 'buyToken',
    args: [monkeyAccount.address, tokenId, '0x0'],
  });

  logger.info(`Bought ${numKeys} keys for room ${roomId}`, {
    txHash,
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

    // Buy keys for rooms
    await Promise.all(
      buyKeyOfRooms.map(roomId => buyKeys({ roomId, numKeys: 1 }))
    );

    await sleepForRandom({
      minMs: 60 * 15 * 1000, // 15 minutes
      maxMs: 60 * 60 * 1000, // 1 hour
    });
  }
};
