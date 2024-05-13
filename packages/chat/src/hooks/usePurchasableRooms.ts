import db from '@/lib/firestore';
import { roomConverter } from '@cred/shared';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query } from 'firebase/firestore';
import useJoinedRooms from './useJoinedRooms';
import useWritableRooms from './useWritableRooms';

const getAllRooms = async () => {
  const q = query(collection(db, 'rooms').withConverter(roomConverter));

  const docs = await getDocs(q);
  const rooms = docs.docs.map(doc => doc.data());
  return rooms;
};

const usePurchasableRooms = (userId: string | null) => {
  const { data: joinedRooms } = useJoinedRooms(userId);
  const { data: writableRooms } = useWritableRooms(userId);

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
    enabled: !!userId && !!joinedRooms && !!writableRooms,
  });
};

export default usePurchasableRooms;
