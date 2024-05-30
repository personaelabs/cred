import { collection, doc, deleteDoc, getDoc } from 'firebase/firestore';
import db from '@/lib/firestore';
import { useMutation } from '@tanstack/react-query';
import { deleteObject, getStorage, ref } from 'firebase/storage';
import { messageConverter } from '@cred/shared';
import * as Sentry from '@sentry/nextjs';

const deleteMessage = async ({
  roomId,
  messageId,
}: {
  roomId: string;
  messageId: string;
}) => {
  const storage = getStorage();
  const messageDoc = doc(
    collection(db, 'rooms', roomId, 'messages'),
    messageId
  ).withConverter(messageConverter);

  const message = (await getDoc(messageDoc)).data();

  await deleteDoc(messageDoc);

  // Delete images from storage
  await Promise.all(
    message?.images.map(async image => {
      try {
        const imageId = image.split('%2F').pop()?.split('?')[0];
        const storageRef = ref(storage, `users/${message.userId}/${imageId}`);
        await deleteObject(storageRef);
      } catch (err) {
        console.error(err);
        Sentry.captureException(err);
      }
    }) || []
  );
};

const useDeleteMessage = (roomId: string) => {
  return useMutation({
    mutationFn: async (messageId: string) => {
      const confirmed = window.confirm('Delete message?');
      if (confirmed) {
        await deleteMessage({
          roomId,
          messageId,
        });
      }
    },
  });
};

export default useDeleteMessage;
