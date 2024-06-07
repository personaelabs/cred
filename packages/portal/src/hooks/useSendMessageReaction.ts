import db from '@/lib/firestore';
import { useMutation } from '@tanstack/react-query';
import { collection, doc, updateDoc } from 'firebase/firestore';
import useSignedInUser from './useSignedInUser';
import { messageConverter } from '@cred/shared';

const sendMessageReaction = async ({
  reaction,
  roomId,
  messageId,
  userId,
}: {
  reaction: string;
  roomId: string;
  messageId: string;
  userId: string;
}) => {
  const messageRef = doc(
    collection(db, 'rooms', roomId, 'messages').withConverter(messageConverter),
    messageId
  );

  await updateDoc(messageRef, {
    [`reactions.${userId}`]: reaction,
  });
};

const useSendMessageReaction = () => {
  const { data: signedInUser } = useSignedInUser();

  return useMutation({
    mutationFn: async ({
      roomId,
      reaction,
      messageId,
    }: {
      roomId: string;
      reaction: string;
      messageId: string;
    }) => {
      if (!signedInUser) {
        throw new Error('User not signed in');
      }

      await sendMessageReaction({
        reaction,
        roomId,
        messageId,
        userId: signedInUser?.id,
      });
    },
  });
};

export default useSendMessageReaction;
