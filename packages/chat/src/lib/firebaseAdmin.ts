import { roomConverter } from '@cred/shared';
import { initAdminApp } from '@cred/firebase';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const app = initAdminApp();
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
    if (!roomData.writerIds.includes(userId)) {
      await roomDoc.update({
        writerIds: FieldValue.arrayUnion(userId),
      });
      console.log('Added writer to room', {
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
