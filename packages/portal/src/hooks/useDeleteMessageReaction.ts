import db from '@/lib/firestore';
import { useMutation } from '@tanstack/react-query';
import { collection, deleteField, doc, updateDoc } from 'firebase/firestore';

import useSignedInUser from './useSignedInUser';
import { messageConverter } from '@cred/shared';

const deleteMessageReaction = async ({
  roomId,
  messageId,
  userId,
}: {
  roomId: string;
  messageId: string;
  userId: string;
}) => {
  const messageRef = doc(
    collection(db, 'rooms', roomId, 'messages').withConverter(messageConverter),
    messageId
  );

  await updateDoc(messageRef, {
    [`reactions.${userId}`]: deleteField(),
  });
};

const useDeleteMessageReaction = () => {
  const { data: signedInUser } = useSignedInUser();

  return useMutation({
    mutationFn: async ({
      roomId,
      messageId,
    }: {
      roomId: string;
      messageId: string;
    }) => {
      if (!signedInUser) {
        throw new Error('User not signed in');
      }

      await deleteMessageReaction({
        roomId,
        messageId,
        userId: signedInUser?.id,
      });
    },
  });
};

export default useDeleteMessageReaction;
