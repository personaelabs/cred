import db from '@/lib/firestore';
import { User, roomConverter } from '@cred/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Firestore, collection, doc, getDoc } from 'firebase/firestore';
import {  useEffect } from 'react';

const getRoomUsers = async (db: Firestore, roomId: string): Promise<User[]> => {
  const docRef = doc(
    collection(db, 'rooms').withConverter(roomConverter),
    roomId
  );

  const roomDoc = await getDoc(docRef);
  const room = roomDoc.data();

  return users;
};

const useRoomUsers = (roomId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ['room-users', { roomId }],
    });
  }, [queryClient, roomId]);

  return useQuery({
    queryKey: ['room-users', { roomId }],
    queryFn: async () => {
      const rooms = await getRoomUsers(db, roomId);
      return rooms;
    },
    staleTime: Infinity,
  });
};

export default useRoomUsers;
