import 'dotenv/config';
import { Room, roomConverter } from '@cred/shared';
import { app } from '@cred/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore(app);

const createRoom = async () => {
  const groupId = 'farcaster-1';
  const name = 'farcaster confidential';

  const roomData: Omit<
    Room,
    | 'joinedUserIds'
    | 'readerIds'
    | 'writerIds'
    | 'isFeatured'
    | 'isHidden'
    | 'pinnedMessage'
    | 'isOpenUntil'
  > = {
    id: groupId,
    name,
    imageUrl: null,
    eligibility: '',
  };

  const newRoomData: Room = {
    ...roomData,
    writerIds: [],
    joinedUserIds: [],
    readerIds: [],
    isFeatured: false,
    isHidden: true,
    pinnedMessage: null,
    isOpenUntil: null,
  };

  const groupDoc = await db
    .collection('rooms')
    .withConverter(roomConverter)
    .doc(groupId);

  await groupDoc.set(newRoomData);
};

createRoom();
