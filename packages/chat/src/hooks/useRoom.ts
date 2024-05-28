import db from '@/lib/firestore';
import { roomConverter } from '@cred/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDoc, doc } from 'firebase/firestore';
import { useEffect } from 'react';

const getRoom = async (roomId: string) => {
  const roomDocRef = doc(
    collection(db, 'rooms').withConverter(roomConverter),
    roomId
  );

  const roomDoc = await getDoc(roomDocRef);
  return roomDoc.data() || null;
};

const useRoom = (roomId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (roomId) {
      queryClient.invalidateQueries({
        queryKey: ['room', { roomId }],
      });
    }
  }, [roomId, queryClient]);

  return useQuery({
    queryKey: ['room', { roomId }],
    queryFn: async () => {
      const room = await getRoom(roomId);
      return room;
    },
    staleTime: Infinity,
  });
};

export default useRoom;
