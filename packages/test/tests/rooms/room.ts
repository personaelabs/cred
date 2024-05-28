import { roomConverter } from '@cred/shared';
import app from '../firestore';
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getFirestore,
  updateDoc,
} from 'firebase/firestore';

export const TEST_ROOM_ID = 'test-room';

const db = getFirestore(app);

export const getRoom = async (roomId: string) => {
  const room = doc(
    collection(db, 'rooms').withConverter(roomConverter),
    roomId
  );

  return (await getDoc(room)).data();
};

export const joinRoom = async ({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) => {
  const room = doc(
    collection(db, 'rooms').withConverter(roomConverter),
    roomId
  );

  await updateDoc(room, {
    joinedUserIds: arrayUnion(userId),
  });
};
