import 'dotenv/config';
import { app } from '@cred/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { roomConverter } from '@cred/shared';

const db = getFirestore(app);

const hideAllRooms = async () => {
  // Add admins as writers to all rooms

  const roomsRef = db.collection('rooms').withConverter(roomConverter);

  const rooms = (await roomsRef.get()).docs;

  const writer = db.batch();

  for (const room of rooms) {
    writer.update(room.ref, {
      isHidden: true,
    });
  }

  await writer.commit();
  console.log('Marked all rooms as hidden');
};

hideAllRooms();
