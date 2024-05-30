import { faker } from '@faker-js/faker';
import { excludePrivyUsers, getRandomElements, sleepForRandom } from './utils';
import { app } from '@cred/firebase';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  MessageVisibility,
  Room,
  logger,
  messageConverter,
  roomConverter,
} from '@cred/shared';

const db = getFirestore(app);

const sendMessage = async ({
  room,
  userId,
  visibility,
}: {
  room: Room; // Room to send message to
  userId: string; // User to send message from
  visibility: MessageVisibility;
}) => {
  const message = faker.lorem.sentence();

  // Get a random subset of users to mention in the message.
  const mentions = getRandomElements(room.joinedUserIds, 3);

  logger.info(`Sending message`, {
    userId,
    room: room.name,
    visibility,
  });

  await db
    .collection('rooms')
    .doc(room.id)
    .collection('messages')
    .withConverter(messageConverter)
    .add({
      id: '',
      userId,
      body: message,
      roomId: room.id,
      readBy: [],
      replyTo: null,
      createdAt: FieldValue.serverTimestamp(),
      mentions,
      images: [],
      visibility,
    });
};

const sendMessagesInRoom = async ({ roomId }: { roomId: string }) => {
  logger.info(`Sending messages in room ${roomId}`);
  const roomRef = await db
    .collection('rooms')
    .withConverter(roomConverter)
    .doc(roomId)
    .get();

  const room = roomRef.data();

  if (!room) {
    throw new Error(`Room ${roomId} not found`);
  }

  // Get a random subset of readers to send messages from.
  const sendMessagesFromReaders = getRandomElements(
    excludePrivyUsers(room.readerIds),
    3
  );

  logger.debug(
    `Sending messages from ${sendMessagesFromReaders.length} readers`
  );

  // Send messages from readers
  await Promise.all(
    sendMessagesFromReaders.map(userId =>
      sendMessage({ room, userId, visibility: MessageVisibility.ONLY_ADMINS })
    )
  );

  // Get a random subset of writers to send messages from.
  const sendMessagesFromWriters = getRandomElements(
    excludePrivyUsers(room.writerIds),
    3
  );

  logger.debug(
    `Sending messages from ${sendMessagesFromWriters.length} writers`
  );

  // Send messages from writers
  await Promise.all(
    sendMessagesFromWriters.map(userId =>
      sendMessage({ room, userId, visibility: MessageVisibility.PUBLIC })
    )
  );
};

/**
 * Send messages in different rooms at random intervals.
 */
export const startMessageMonkey = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const roomsRef = db.collection('rooms').withConverter(roomConverter);
    const rooms = (await roomsRef.get()).docs.map(doc => doc.data());

    const roomsWithUsers = rooms.filter(
      room => excludePrivyUsers(room.joinedUserIds).length > 0
    );

    if (roomsWithUsers.length !== 0) {
      // Determine how many rooms to send messages in.
      const numRoomsToMessage = faker.number.int({
        min: 1,
        max: Math.max(roomsWithUsers.length / 10, 2),
      });

      logger.info(`Sending messages in ${numRoomsToMessage} rooms`);

      // Get a random subset of rooms to send messages in.
      const roomsIdsToMessage = getRandomElements(
        roomsWithUsers.map(room => room.id),
        numRoomsToMessage
      );

      for (const roomId of roomsIdsToMessage) {
        await sendMessagesInRoom({ roomId });
      }
    } else {
      logger.info('No rooms with users to send messages in');
    }

    await sleepForRandom({
      minMs: 60 * 5 * 1000, // 5 minutes
      maxMs: 60 * 15 * 1000, // 15 minutes
    });
  }
};
