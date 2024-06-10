import db from '@/lib/firestore';
import roomKeys from '@/queryKeys/roomKeys';
import { roomConverter } from '@cred/shared';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query } from 'firebase/firestore';

const getAllRooms = async () => {
  const q = query(collection(db, 'rooms').withConverter(roomConverter));

  const docs = await getDocs(q);
  const rooms = docs.docs.map(doc => doc.data());
  return rooms;
};

const useAllRooms = () => {
  const { data } = useQuery({
    queryKey: roomKeys.all,
    queryFn: async () => {
      const allRooms = await getAllRooms();
      return allRooms;
    },
    initialData: [],
  });

  return { data };
};

export default useAllRooms;
