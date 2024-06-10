import db from '@/lib/firestore';
import roomKeys from '@/queryKeys/roomKeys';
import { roomConverter } from '@cred/shared';
import { useQuery } from '@tanstack/react-query';
import { query, collection, where, getDocs } from 'firebase/firestore';

const getJoinedRooms = async (userId: string) => {
  const q = query(
    collection(db, 'rooms').withConverter(roomConverter),
    where('joinedUserIds', 'array-contains', userId),
    where('isHidden', '==', false)
  );

  const docs = await getDocs(q);
  const rooms = docs.docs.map(doc => doc.data());
  return rooms;
};

const useJoinedRooms = (userId: string | null) => {
  return useQuery({
    queryKey: roomKeys.joinedRooms,
    queryFn: async () => {
      const rooms = await getJoinedRooms(userId!);
      return rooms;
    },
    enabled: !!userId,
  });
};

export default useJoinedRooms;
