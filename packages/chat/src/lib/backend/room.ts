import { roomConverter } from '@cred/shared';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import app from './firebaseAdmin';

const db = getFirestore(app);

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
      console.log('Added reader to room', {
        roomId,
        userId,
      });
    } else {
      console.warn('Writer already in room:', {
        roomId,
        userId,
      });
    }
  } else {
    console.error(`Room not found: ${roomId}`);
  }
};
