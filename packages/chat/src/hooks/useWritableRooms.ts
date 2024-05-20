import db from '@/lib/firestore';
import { roomConverter } from '@cred/shared';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import useJoinedRooms from './useJoinedRooms';

const getWritableRooms = async (userId: string) => {
  const q = query(
    collection(db, 'rooms').withConverter(roomConverter),
    where('writerIds', 'array-contains', userId)
  );

  const docs = await getDocs(q);

  const rooms = docs.docs.map(doc => doc.data());

  return rooms;
};

const useWritableRooms = (userId: string | null) => {
  const { data: joinedRooms } = useJoinedRooms(userId);

  return useQuery({
    queryKey: ['writable-rooms', { userId }],
    queryFn: async () => {
      const writableRooms = await getWritableRooms(userId!);

      const rooms = writableRooms.filter(room => {
        return !joinedRooms!.some(joinedRoom => joinedRoom.id === room.id);
      });
      return rooms;
    },
    initialData: [],
    enabled: !!userId && !!joinedRooms,
  });
};

export default useWritableRooms;
