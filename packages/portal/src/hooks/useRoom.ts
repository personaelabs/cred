import db from '@/lib/firestore';
import { roomConverter } from '@cred/shared';
import { useQuery } from '@tanstack/react-query';
import { collection, getDoc, doc } from 'firebase/firestore';
import roomKeys from '@/queryKeys/roomKeys';

const getRoom = async (roomId: string) => {
  const roomDocRef = doc(
    collection(db, 'rooms').withConverter(roomConverter),
    roomId
  );

  const roomDoc = await getDoc(roomDocRef);
  return roomDoc.data() || null;
};

const useRoom = (roomId: string) => {
  return useQuery({
    queryKey: roomKeys.room(roomId),
    queryFn: async () => {
      const room = await getRoom(roomId);
      return room;
    },
  });
};

export default useRoom;
