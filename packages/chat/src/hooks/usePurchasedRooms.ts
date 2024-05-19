import db from '@/lib/firestore';
import { roomConverter } from '@cred/shared';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import useJoinedRooms from './useJoinedRooms';

const getPurchasedRooms = async (userId: string) => {
  const q = query(
    collection(db, 'rooms').withConverter(roomConverter),
    where('readerIds', 'array-contains', userId)
  );

  const docs = await getDocs(q);

  const rooms = docs.docs.map(doc => doc.data());

  return rooms;
};

const usePurchasedRooms = (userId: string | null) => {
  const { data: joinedRooms } = useJoinedRooms(userId);

  return useQuery({
    queryKey: ['purchased-rooms'],
    queryFn: async () => {
      const purchasedRooms = await getPurchasedRooms(userId!);

      const rooms = purchasedRooms.filter(room => {
        return !joinedRooms!.some(joinedRoom => joinedRoom.id === room.id);
      });
      return rooms;
    },
    initialData: [],
    enabled: !!userId && !!joinedRooms,
  });
};

export default usePurchasedRooms;
