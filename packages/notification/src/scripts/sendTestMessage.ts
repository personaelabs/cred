import 'dotenv/config';
import {
  Message,
  MessageVisibility,
  Room,
  User,
  messageConverter,
  roomConverter,
} from '@cred/shared';
import { app } from '@cred/firebase';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore(app);

const ADMIN_FIDS = ['1', 'did:privy:clw1w6dar0fdfmhd5ae1rfna6'];

const registerFid1 = async () => {
  const USER_ID = '1';
  const userRef = db.collection('users').doc(USER_ID);
  const userData: User = {
    id: USER_ID,
    displayName: 'Farcaster',
    username: 'farcaster',
    privyAddress: '0x',
    pfpUrl: 'https://i.imgur.com/I2rEbPF.png',
    config: {
      notification: {
        mutedRoomIds: [],
      },
    },
    addedCreddd: [],
    connectedAddresses: [],
  };

  await userRef.set(userData);
};

const createNotificationTestRoom = async () => {
  const roomData: Room = {
    id: 'test-notification',
    name: 'Test Notification Room',
    writerIds: ADMIN_FIDS,
    readerIds: [],
    joinedUserIds: ADMIN_FIDS,
    imageUrl: '',
  };

  await db
    .collection('rooms')
    .doc('test-notification')
    .withConverter(roomConverter)
    .set(roomData);
};

const sendMessage = async ({
  roomId,
  message,
  sender,
}: {
  roomId: string;
  message: string;
  sender: string;
}) => {
  console.log(`Sending message ${message} to ${roomId}`);
  const data: Message = {
    id: '',
    roomId,
    body: message,
    userId: sender,
    createdAt: new Date(),
    readBy: [],
    replyTo: null,
    mentions: [],
    images: [],
    visibility: MessageVisibility.PUBLIC,
  };

  await db
    .collection('rooms')
    .doc(roomId)
    .collection('messages')
    .withConverter(messageConverter)
    .add(data);
};

const sendTestMessage = async () => {
  await registerFid1();
  await createNotificationTestRoom();

  const nonce = Math.floor(Math.random() * 1000000);
  await sendMessage({
    roomId: 'test-notification',
    message: `Hello, world! ${nonce}`,
    sender: '1',
  });
};

sendTestMessage();
