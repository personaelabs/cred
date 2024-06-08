import { addWriterToRoom, app } from '@cred/firebase-admin';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';
import { User, roomConverter } from '@cred/shared';
import { getRandomElements, sleepForRandom } from './utils';
import logger from './logger';

const db = getFirestore(app);

/**
 * Create a user with random name, pfp, and privy address
 */
const createUser = async () => {
  const userId = faker.string.uuid();

  const displayName = faker.person.fullName();
  const pfpUrl = faker.image.avatar();
  const privyAddress = faker.string.hexadecimal({ length: 40 });

  const userData: User = {
    id: userId,
    displayName,
    username: displayName.toLowerCase().replace(' ', '_'),
    pfpUrl,
    privyAddress,
    config: {
      notification: {
        mutedRoomIds: [],
      },
    },
    connectedAddresses: [],
    addedCreddd: [],
    inviteCode: 'test',
  };

  logger.info(`Creating user ${userId}`);
  await db.collection('users').doc(userId).set(userData);
  return userId;
};

/**
 * Add a user to a room's `joinedUserIds` list
 */
const joinRoom = async ({
  userId,
  roomId,
}: {
  userId: string;
  roomId: string;
}) => {
  logger.info(`Adding user to room`, {
    userId,
    roomId,
  });

  await db
    .collection('rooms')
    .doc(roomId)
    .update({
      joinedUserIds: FieldValue.arrayUnion(userId),
    });
};

/**
 * Create and add users to room randomly in random intervals
 */
export const startUserMonkey = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const roomsRef = await db
      .collection('rooms')
      .withConverter(roomConverter)
      .get();

    const rooms = roomsRef.docs.map(doc => doc.data());

    // Determine how many users to create.
    // This is a random number between 1 and 5.
    const numUsersToCreate = faker.number.int({ min: 1, max: 5 });

    for (let i = 0; i < numUsersToCreate; i++) {
      const userId = await createUser();

      // Determine how many rooms the created user should join.
      const numRoomsToJoin = faker.number.int({ min: 1, max: 3 });

      // Get a random subset of rooms to join.
      const roomsToJoin = getRandomElements(rooms, numRoomsToJoin);

      // Add the user to each room as a writer
      await Promise.all(
        roomsToJoin.map(async room => {
          // Add the user as a writer to the room
          await addWriterToRoom({ userId, roomId: room.id });

          // Now that the user is a writer in the room, add them to the room
          await joinRoom({ userId, roomId: room.id });
        })
      );
    }

    await sleepForRandom({
      minMs: 60 * 5 * 1000, // 5 minutes
      maxMs: 60 * 15 * 1000, // 15 minutes
    });
  }
};
