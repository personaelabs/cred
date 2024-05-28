import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from 'firebase/firestore';
import app from '../firestore';
import { Message, MessageVisibility, messageConverter } from '@cred/shared';

const db = getFirestore(app);

export const createMessage = async ({
  roomId,
  userId,
  visibility,
}: {
  roomId: string;
  userId: string;
  visibility: MessageVisibility;
}) => {
  const messagesRef = collection(db, 'rooms', roomId, 'messages').withConverter(
    messageConverter
  );

  const data: Omit<Message, 'id'> = {
    roomId,
    body: 'Hello, world!',
    mentions: [],
    userId,
    createdAt: serverTimestamp(),
    readBy: [],
    replyTo: null,
    images: [],
    visibility,
  };

  return await addDoc(messagesRef, data);
};
