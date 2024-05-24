import { faker } from '@faker-js/faker';
import { getRandomElements, sleepForRandom } from './utils';
import { app } from '@cred/firebase';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { messageConverter, roomConverter, userConverter } from '@cred/shared';

const db = getFirestore(app);

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
      max: rooms.size / 2,
    });

    const allRoomIds = rooms.docs.map(doc => doc.id);
    const roomsIdsToMessage = getRandomElements(allRoomIds, numRoomsToMessage);

    for (const roomId of roomsIdsToMessage) {
      await sendMessagesInRoom({ roomId });
    }

    await sleepForRandom({
      minMs: 1000,
      maxMs: 60 * 1000,
    });
  }
};
