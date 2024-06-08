import 'dotenv/config';
import { app } from '@cred/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { messageConverter, roomConverter } from '@cred/shared';

const db = getFirestore(app);

const fillEmptyReactions = async () => {
  // Add admins as writers to all rooms

  const roomsRef = db.collection('rooms').withConverter(roomConverter);

  const rooms = (await roomsRef.get()).docs;

  for (const room of rooms) {
    const messages = await db
      .collection('rooms')
      .doc(room.id)
      .collection('messages')
      .withConverter(messageConverter)
      .get();
    console.log(
      `Found ${messages.docs.length} messages in room ${room.data().name}`
    );

    const writer = db.batch();

    for (const message of messages.docs) {
      if (!message.data().reactions) {
        writer.update(message.ref, {
          reactions: {},
        });
      }
    }

    await writer.commit();
    console.log('Filled empty reactions for room', room.data().name);
  }
};

fillEmptyReactions();
