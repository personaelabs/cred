import db from '@/lib/firestore';
import { roomConverter } from '@cred/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query } from 'firebase/firestore';
import useJoinedRooms from './useJoinedRooms';
import useWritableRooms from './useWritableRooms';
import { useEffect } from 'react';

const getAllRooms = async () => {
  const q = query(collection(db, 'rooms').withConverter(roomConverter));

  const docs = await getDocs(q);
  const rooms = docs.docs.map(doc => doc.data());
  return rooms;
};

const usePurchasableRooms = (userId: string | null) => {
  const { data: joinedRooms } = useJoinedRooms(userId);
  const { data: writableRooms } = useWritableRooms(userId);

  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ['purchasable-rooms', { userId }],
    });
  }, [queryClient, userId]);

  return useQuery({
    queryKey: ['purchasable-rooms', { userId }],
    queryFn: async () => {
      const allRooms = await getAllRooms();
      const purchasableRooms = allRooms.filter(room => {
        return (
          !joinedRooms!.some(joinedRoom => joinedRoom.id === room.id) &&
          !writableRooms!.some(writableRoom => writableRoom.id === room.id)
        );
      });

      return purchasableRooms;
    },
    staleTime: Infinity,
    initialData: [],
    enabled: !!userId && !!joinedRooms && !!writableRooms,
  });
};

export default usePurchasableRooms;
