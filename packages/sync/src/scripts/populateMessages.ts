import 'dotenv/config';
import {
  Message,
  Room,
  User,
  messageConverter,
  roomConverter,
} from '@cred/shared';
import { faker } from '@faker-js/faker';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { app } from '@cred/firebase';

const db = getFirestore(app);

const NUM_MESSAGES = 1000;
const NUM_USERS = 100;
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

const registerUser = async (userId: string) => {
  const userRef = db.collection('users').doc(userId);
  const userData: User = {
    id: userId,
    displayName: faker.person.fullName(),
    username: faker.internet.userName(),
    pfpUrl: faker.image.avatar(),
    privyAddress: '0x',
    config: {
      notification: {
        mutedRoomIds: [],
      },
    },
  };

  await userRef.set(userData);
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
        userId: `${FAKE_USER_PREFIX}${Math.floor(Math.random() * NUM_USERS).toString()}`,
        createdAt: faker.date.between({
          from: doc.data().createdAt as Date,
          to: new Date(),
        }),
        readBy: [],
        replyTo: doc.id,
        mentions: [],
      };

      await addToRoom(replyMessage.userId);
      const replyRef = await messagesCollection.add(replyMessage);
      console.log(`Added reply with ID: ${replyRef.id}`);
    })
  );
};

const FAKE_USER_PREFIX = 'fake-user:';

const populateUsers = async () => {
  for (let i = 0; i < NUM_USERS; i++) {
    await registerUser(`${FAKE_USER_PREFIX}${i}`);
  }
};

const deleteMessages = async () => {
  const messagesCollection = db
    .collection('rooms')
    .doc(TEST_ROOM_ID)
    .collection('messages');

  const messages = await messagesCollection.get();

  const batch = db.batch();

  await Promise.all(
    messages.docs.map(async doc => {
      batch.delete(doc.ref);
    })
  );

  await batch.commit();
};

const populateMessages = async () => {
  await deleteMessages();
  // Delete the room if it already exists
  await db.collection('rooms').doc(TEST_ROOM_ID);

  const messages: Message[] = [];

  for (let i = 0; i < NUM_MESSAGES; i++) {
    const message: Message = {
      id: '',
      roomId: TEST_ROOM_ID,
      body: faker.lorem.sentence(),
      userId: `${FAKE_USER_PREFIX}${Math.floor(Math.random() * NUM_USERS).toString()}`,
      createdAt: faker.date.past(),
      readBy: [],
      replyTo: null,
      mentions: [],
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
  await populateUsers();
  await populateMessages();
  await populateReplies();
};

populate().then(() => {
  console.log('Done populating messages');
  process.exit(0);
});
