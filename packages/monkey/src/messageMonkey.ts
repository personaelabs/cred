import { faker } from '@faker-js/faker';
import { getRandomElements, sleepForRandom } from './utils';
import { app } from '@cred/firebase';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { messageConverter, roomConverter, userConverter } from '@cred/shared';

const db = getFirestore(app);

const ADMIN_USER_IDS = ['did:privy:clw1w6dar0fdfmhd5ae1rfna6'];

const sendMessage = async ({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) => {
  const usersRef = db.collection('users').withConverter(userConverter);

  const message = faker.lorem.sentence();
  const { count: numUsers } = (await usersRef.count().get()).data();

  const mentionUsers = await usersRef
    .offset(
      faker.number.int({
        min: 0,
        max: numUsers,
      })
    )
    .limit(5)
    .get();

  const mentions = mentionUsers.docs.map(doc => doc.data().id);

  // Mention admins in 20% of messages
  if (Math.random() < 20 / 100) {
    mentions.push(...ADMIN_USER_IDS);
  }

  console.log(`Sending message to ${roomId} from ${userId}`);
  await db
    .collection('rooms')
    .doc(roomId)
    .collection('messages')
    .withConverter(messageConverter)
    .add({
      id: '',
      userId,
      body: message,
      roomId,
      readBy: [],
      replyTo: null,
      createdAt: FieldValue.serverTimestamp(),
      mentions,
      images: [],
    });
};

const sendMessagesInRoom = async ({ roomId }: { roomId: string }) => {
  const roomRef = await db
    .collection('rooms')
    .withConverter(roomConverter)
    .doc(roomId)
    .get();

  const roomData = roomRef.data();

  if (!roomData) {
    throw new Error(`Room ${roomId} not found`);
  }

  const sendMessagesFrom = getRandomElements(roomData.joinedUserIds, 5);

  await Promise.all(
    sendMessagesFrom.map(userId => sendMessage({ roomId, userId }))
  );
};

/**
 * Send messages in different rooms at random intervals.
 */
export const startMessageMonkey = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const roomsRef = db.collection('rooms').withConverter(roomConverter);
    const rooms = await roomsRef.get();

    const numRoomsToMessage = faker.number.int({
      min: 1,
      max: rooms.size / 10,
    });

    const allRoomIds = rooms.docs.map(doc => doc.id);
    const roomsIdsToMessage = getRandomElements(allRoomIds, numRoomsToMessage);

    for (const roomId of roomsIdsToMessage) {
      await sendMessagesInRoom({ roomId });
    }

    await sleepForRandom({
      minMs: 60 * 15 * 1000, // 15 minutes
      maxMs: 60 * 60 * 1000, // 1 hour
    });
  }
};
