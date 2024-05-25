import db from '@/lib/firestore';
import { messageConverter } from '@cred/shared';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';

export const getRoomLatestMessage = async (roomId: string) => {
  const messagesRef = collection(db, 'rooms', roomId, 'messages').withConverter(
    messageConverter
  );

  const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));

  const docs = (await getDocs(q)).docs;

  if (docs.length === 0) {
    return null;
  }

  const message = docs[0].data();
  return message;
};

const useRoomLatestMessage = (roomId: string) => {
  return useQuery({
    queryKey: ['latest-message', { roomId }],
    queryFn: async () => {
      return await getRoomLatestMessage(roomId);
    },
  });
};

export default useRoomLatestMessage;
