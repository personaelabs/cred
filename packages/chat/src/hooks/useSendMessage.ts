import { useMutation } from '@tanstack/react-query';
import useSignedInUser from './useSignedInUser';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Message, messageConverter } from '@cred/shared';
import db from '@/lib/firestore';

const sendMessage = async ({
  roomId,
  message,
  replyTo,
  sender,
}: {
  roomId: string;
  message: string;
  replyTo: string | null;
  sender: number;
}) => {
  console.log(`Sending message ${message} to ${roomId}`);
  // Create the room if it doens't exit

  const messagesRef = collection(db, 'rooms', roomId, 'messages').withConverter(
    messageConverter
  );

  const data: Omit<Message, 'id'> = {
    roomId,
    body: message,
    fid: sender,
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
        sender: signedInUser.fid!,
      });
    },
  });
};

export default useSendMessage;
