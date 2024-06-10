import 'dotenv/config';
import { app } from '@cred/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { roomConverter } from '@cred/shared';

const db = getFirestore(app);

const showRooms = async () => {
  // Add admins as writers to all rooms
  const ROOM_IDS = [
    '0f52c884729bb73f81eafc295e9c8fd492475e28e3cbedba5eed4932049caa70', // base salon
    '3c674ad1bf73d3950d1734f4cdc37cd69aec58e9b47c2f19e3784f7e957545a6', // eth salon
    'b796c128590828f60d84a50abefea8728e3124096614830b371407ab91c86132', // blast salon
    '6c032e7d80cfcc373749ca12f4c28a664193cdf5a60f76383ebbfa788ab93c68', // friend bag holder
  ];

  const writer = db.batch();

  for (const roomId of ROOM_IDS) {
    const roomRef = db
      .collection('rooms')
      .doc(roomId)
      .withConverter(roomConverter);
    writer.update(roomRef, {
      isHidden: false,
    });
  }

  await writer.commit();
  console.log('Marked all rooms as not hidden');
};

showRooms();
