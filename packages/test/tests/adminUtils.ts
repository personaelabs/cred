import { app } from '@cred/firebase';
import {
  MessageVisibility,
  messageConverter,
  roomConverter,
  userConverter,
} from '@cred/shared';
import { getFirestore } from 'firebase-admin/firestore';
import { TEST_ROOM_ID } from './rooms/room';

const db = getFirestore(app);

export const deleteRoom = async (roomId: string) => {
  await db.collection('rooms').doc(roomId).delete();
};

export const createUser = async (userId: string) => {
  return await db
    .collection('users')
    .withConverter(userConverter)
    .add({
      id: userId,
      displayName: 'Test user',
      username: '',
      pfpUrl: '',
      privyAddress: '0x0',
      config: {
        notification: {
          mutedRoomIds: [],
        },
      },
      connectedAddresses: [],
    });
};

export const deleteUser = async (userId: string) => {
  await db.collection('users').doc(userId).delete();
};

export const createMessage = async ({
  roomId,
  userId,
  visibility,
}: {
  roomId: string;
  userId: string;
  visibility: MessageVisibility;
}) => {
  const data = {
    id: '',
    roomId,
    body: 'Hello, world!',
    mentions: [],
    userId,
    createdAt: new Date(),
    readBy: [],
    replyTo: null,
    images: [],
    visibility,
  };

  return await db
    .collection('rooms')
    .doc(roomId)
    .collection('messages')
    .withConverter(messageConverter)
    .add(data);
};

export const initTestRoom = async () => {
  await db
    .collection('rooms')
    .withConverter(roomConverter)
    .doc(TEST_ROOM_ID)
    .set({
      id: TEST_ROOM_ID,
      name: 'Test Room',
      joinedUserIds: [],
      readerIds: [],
      writerIds: [],
      imageUrl: null,
    });
};
