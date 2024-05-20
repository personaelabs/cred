import { collection, doc, deleteDoc } from 'firebase/firestore';
import db from '@/lib/firestore';
import { useMutation } from '@tanstack/react-query';

const deleteMessage = async ({
  roomId,
  messageId,
}: {
  roomId: string;
  messageId: string;
}) => {
  await deleteDoc(doc(collection(db, 'rooms', roomId, 'messages'), messageId));
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
