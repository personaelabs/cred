import 'dotenv/config';
import { Message, Room, messageConverter, roomConverter } from '@cred/shared';
import { db } from '../lib/firebase';

const ADMIN_FIDS = ['1', '12783'];

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
  };

  await db
    .collection('rooms')
    .doc(roomId)
    .collection('messages')
    .withConverter(messageConverter)
    .add(data);
};

const sendTestMessage = async () => {
  await createNotificationTestRoom();
  await sendMessage({
    roomId: 'test-notification',
    message: 'Hello, world!',
    sender: '1',
  });
};

sendTestMessage();
