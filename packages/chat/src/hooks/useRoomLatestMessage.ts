import db from '@/lib/firestore';
import { messageConverter } from '@cred/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { useEffect } from 'react';

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
  const queryClient = useQueryClient();
  useEffect(() => {
    const messagesRef = collection(
      db,
      'rooms',
      roomId,
      'messages'
    ).withConverter(messageConverter);

    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, async snapshot => {
      const doc = snapshot.docs[0];
      if (doc) {
        const message = doc.data();
        console.log('Setting latest message', message);
        queryClient.setQueryData(['latest-message', { roomId }], message);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, roomId]);

  return useQuery({
    queryKey: ['latest-message', { roomId }],
    queryFn: async () => {
      return await getRoomLatestMessage(roomId);
    },
  });
};

export default useRoomLatestMessage;
