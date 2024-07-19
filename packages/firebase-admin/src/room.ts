import { roomConverter } from '@cred/shared';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import app from './app';

const db = getFirestore(app);

export const addWriterToRoom = async ({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) => {
  const roomDoc = await db
    .collection('rooms')
    .withConverter(roomConverter)
    .doc(roomId);

  const room = await roomDoc.get();
  const roomData = room.data();

  if (roomData) {
    if (!roomData.writerIds.includes(userId)) {
      await roomDoc.update({
        writerIds: FieldValue.arrayUnion(userId),
      });
    }
  } else {
    console.error(`Room not found: ${roomId}`);
  }
};

export const addReaderToRoom = async ({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) => {
  const roomDoc = await db
    .collection('rooms')
    .withConverter(roomConverter)
    .doc(roomId);

  const room = await roomDoc.get();
  const roomData = room.data();

  if (roomData) {
    if (!roomData.readerIds.includes(userId)) {
      await roomDoc.update({
        readerIds: FieldValue.arrayUnion(userId),
      });
    }
  } else {
    console.error(`Room not found: ${roomId}`);
  }
};

export const removeUserFromRoom = async ({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) => {
  const roomDoc = await db
    .collection('rooms')
    .withConverter(roomConverter)
    .doc(roomId);

  const room = await roomDoc.get();
  const roomData = room.data();

  if (roomData) {
    if (roomData.readerIds.includes(userId)) {
      await roomDoc.update({
        readerIds: FieldValue.arrayRemove(userId),
        joinedUserIds: FieldValue.arrayRemove(userId),
      });
    }
  } else {
    console.error(`Room not found: ${roomId}`);
  }
};
