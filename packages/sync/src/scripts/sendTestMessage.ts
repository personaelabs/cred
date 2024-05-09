import 'dotenv/config';
import { Message, messageConverter } from '@cred/shared';
import { db } from '../lib/firebase';

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
  await sendMessage({
    roomId: 'test',
    message: 'Hello, world!',
    sender: 1,
  });
};

sendTestMessage();
