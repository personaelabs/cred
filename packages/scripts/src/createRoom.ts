import 'dotenv/config';
import { Room, roomConverter } from '@cred/shared';
import { app } from '@cred/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore(app);

const createRoom = async () => {
  const groupId = 'ethcc-2024';
  const name = 'What happened at EthCC?';

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
