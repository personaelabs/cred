import 'dotenv/config';
import { Message, Room, messageConverter, roomConverter } from '@cred/shared';
import { db } from '../lib/firebase';

const ADMIN_FIDS = [12783];

const createNotificationTestRoom = async () => {
  const roomData: Room = {
    id: 'test-notification',
    name: 'Test Notification Room',
    adminFids: ADMIN_FIDS,
    fids: ADMIN_FIDS,
    invitedFids: [],
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
  sender: number;
}) => {
  console.log(`Sending message ${message} to ${roomId}`);
  const data: Message = {
    id: '',
    roomId,
    body: message,
    fid: sender,
    createdAt: new Date(),
    readBy: [],
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
    sender: 1,
  });
};

sendTestMessage();
