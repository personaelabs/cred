import { useMutation } from '@tanstack/react-query';
import useSignedInUser from './useSignedInUser';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Message, messageConverter } from '@cred/shared';
import db from '@/lib/firestore';

const sendMessage = async ({
  roomId,
  message,
  replyTo,
  senderId,
}: {
  roomId: string;
  message: string;
  replyTo: string | null;
  senderId: string;
}) => {
  console.log(`Sending message ${message} to ${roomId}`);
  // Create the room if it doens't exit

  const messagesRef = collection(db, 'rooms', roomId, 'messages').withConverter(
    messageConverter
  );

  const data: Omit<Message, 'id'> = {
    roomId,
    body: message,
    userId: senderId,
    createdAt: serverTimestamp(),
    readBy: [],
    replyTo,
  };

  await addDoc(messagesRef, data);
};

const useSendMessage = (roomId: string) => {
  const { data: signedInUser } = useSignedInUser();

  return useMutation({
    mutationKey: ['sendMessage', { roomId }],
    mutationFn: async ({
      replyTo,
      message,
    }: {
      replyTo: string | null;
      message: string;
    }) => {
      if (!signedInUser) {
        throw new Error('User not signed in');
      }

      await sendMessage({
        roomId,
        message,
        replyTo,
        senderId: signedInUser.id,
      });
    },
  });
};

export default useSendMessage;
