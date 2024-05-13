import 'dotenv/config';
import { Message, Room, messageConverter, roomConverter } from '@cred/shared';
import { db } from '../lib/firebase';
import { faker } from '@faker-js/faker';
import { FieldValue } from 'firebase-admin/firestore';

const NUM_MESSAGES = 100;
const MAX_FID = 500000;
const TEST_ROOM_ID = 'test';

const createTestRoom = async () => {
  const room: Room = {
    id: TEST_ROOM_ID,
    name: 'Test Room',
    joinedUserIds: ['12783'],
    readerIds: [],
    writerIds: ['12783'],
    imageUrl: null,
  };
  console.log('Creating test room');
  const roomRef = db.collection('rooms').doc(TEST_ROOM_ID);
  await roomRef.withConverter(roomConverter).set(room);
};

const addedUserIds = new Set<string>();
const addToRoom = async (userId: string) => {
  if (addedUserIds.has(userId)) {
    return;
  }
  const roomRef = db.collection('rooms').doc(TEST_ROOM_ID);
  await roomRef.update({
    joinedUserIds: FieldValue.arrayUnion(userId),
  });

  addedUserIds.add(userId);
};

const populateReplies = async () => {
  const messagesCollection = db
    .collection('rooms')
    .doc(TEST_ROOM_ID)
    .collection('messages')
    .withConverter(messageConverter);

  const messages = await messagesCollection.get();

  await Promise.all(
    messages.docs.map(async doc => {
      if (Math.random() < 0.1) {
        return;
      }

      const replyMessage: Message = {
        id: '',
        roomId: TEST_ROOM_ID,
        body: faker.lorem.sentence(),
        userId: (Math.floor(Math.random() * MAX_FID) + 1).toString(),
        createdAt: faker.date.between({
          from: doc.data().createdAt as Date,
          to: new Date(),
        }),
        readBy: [],
        replyTo: doc.id,
      };

      await addToRoom(replyMessage.userId);
      const replyRef = await messagesCollection.add(replyMessage);
      console.log(`Added reply with ID: ${replyRef.id}`);
    })
  );
};

const populateMessages = async () => {
  // Delete the room if it already exists
  await db.collection('rooms').doc(TEST_ROOM_ID).delete();

  const messages: Message[] = [];

  for (let i = 0; i < NUM_MESSAGES; i++) {
    const message: Message = {
      id: '',
      roomId: TEST_ROOM_ID,
      body: faker.lorem.sentence(),
      userId: (Math.floor(Math.random() * MAX_FID) + 1).toString(),
      createdAt: faker.date.past(),
      readBy: [],
      replyTo: null,
    };
    messages.push(message);
  }

  const messagesCollection = db
    .collection('rooms')
    .doc(TEST_ROOM_ID)
    .collection('messages')
    .withConverter(messageConverter);

  await createTestRoom();

  await Promise.all(
    messages.map(async message => {
      await addToRoom(message.userId);
      const messageRef = await messagesCollection.add(message);
      console.log(`Added message with ID: ${messageRef.id}`);
    })
  );
};

const populate = async () => {
  await populateMessages();
  await populateReplies();
};

populate().then(() => {
  console.log('Done populating messages');
  process.exit(0);
});
