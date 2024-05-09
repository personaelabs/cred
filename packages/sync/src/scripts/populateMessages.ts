import 'dotenv/config';
import { Message, Room, messageConverter, roomConverter } from '@cred/shared';
import { db } from '../lib/firebase';
import { faker } from '@faker-js/faker';
import { FieldValue } from 'firebase-admin/firestore';

const NUM_MESSAGES = 10;
const MAX_FID = 500000;
const TEST_ROOM_ID = 'test';

const createTestRoom = async () => {
  const room: Room = {
    id: TEST_ROOM_ID,
    name: 'Test Room',
    fids: [12783],
    imageUrl: faker.image.avatar(),
    invitedFids: [],
    adminFids: [12783],
  };

  const roomRef = db.collection('rooms').doc(TEST_ROOM_ID);
  await roomRef.withConverter(roomConverter).set(room);
};

const addedFids = new Set<number>();
const addToRoom = async (fid: number) => {
  if (addedFids.has(fid)) {
    return;
  }
  const roomRef = db.collection('rooms').doc(TEST_ROOM_ID);
  await roomRef.update({
    fids: FieldValue.arrayUnion(fid),
  });

  addedFids.add(fid);
};

const populateMessages = async () => {
  // Delete the room if it already exists
  await db.collection('rooms').doc(TEST_ROOM_ID).delete();

  const messages: Message[] = [];

  for (let i = 0; i < NUM_MESSAGES; i++) {
    const message: Message = {
      roomId: TEST_ROOM_ID,
      body: faker.lorem.sentence(),
      fid: Math.floor(Math.random() * MAX_FID) + 1,
      createdAt: new Date(),
      readBy: [],
    };
    console.log(message);
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
      await addToRoom(message.fid);
      const messageRef = await messagesCollection.add(message);
      console.log(`Added message with ID: ${messageRef.id}`);
    })
  );
};

populateMessages().then(() => {
  console.log('Messages populated successfully');
});
