import db from '@/lib/firestore';
import { roomConverter } from '@cred/shared';
import { useMutation } from '@tanstack/react-query';
import { Firestore, collection, deleteDoc, doc,  } from 'firebase/firestore';

const deleteRoom = async (
  db: Firestore,
  roomId: string,
) => {
  console.log(`Deleting room ${roomId}`);
  // Create the room if it doens't exit
  const roomsRef = doc(
    collection(db, 'rooms').withConverter(roomConverter),
    roomId
  );
  await deleteDoc(roomsRef);
};

const useDeleteRoom = () => {

  return useMutation({
    mutationFn: async ({
      roomId,
    }: {
      roomId: string;
    }) => {
        await deleteRoom(db, roomId);
    },
  });
};

export default useDeleteRoom;
