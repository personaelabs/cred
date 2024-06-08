import 'dotenv/config';
import { app } from '@cred/firebase-admin';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { roomConverter } from '@cred/shared';

const db = getFirestore(app);

const ADMIN_IDS = [
  'did:privy:clwh3g7iv0joa96auzksbxy6d', // @lucky
  'did:privy:clw1w6dar0fdfmhd5ae1rfna6', // @dantehrani.eth
];

const addAdmins = async () => {
  // Add admins as writers to all rooms

  const roomsRef = db.collection('rooms').withConverter(roomConverter);

  const rooms = (await roomsRef.get()).docs;

  const writer = db.batch();

  for (const room of rooms) {
    for (const adminId of ADMIN_IDS) {
      if (!room.data().writerIds.includes(adminId)) {
        writer.update(room.ref, {
          writerIds: FieldValue.arrayUnion(adminId),
        });
      }
    }
  }

  await writer.commit();
  console.log('Added admins as writers to all rooms');
};

addAdmins();
