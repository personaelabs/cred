import { app } from '@cred/firebase';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';
import { User, roomConverter } from '@cred/shared';
import { getRandomElements, sleepForRandom } from './utils';

const db = getFirestore(app);

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
  };

  console.log(`Creating user ${userId}`);
  await db.collection('users').doc(userId).set(userData);
  return userId;
};

const addUserToRoom = async ({
  userId,
  roomId,
}: {
  userId: string;
  roomId: string;
}) => {
  console.log(`Adding user ${userId} to room ${roomId}`);
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

    const numUsersToCreate = faker.number.int({ min: 1, max: 5 });

    for (let i = 0; i < numUsersToCreate; i++) {
      const userId = await createUser();

      const numRoomsToJoin = faker.number.int({ min: 1, max: 3 });

      const roomsToJoin = getRandomElements(rooms, numRoomsToJoin);

      await Promise.all(
        roomsToJoin.map(room => addUserToRoom({ userId, roomId: room.id }))
      );
    }

    await sleepForRandom({
      minMs: 1000,
      maxMs: 60 * 1000,
    });
  }
};
