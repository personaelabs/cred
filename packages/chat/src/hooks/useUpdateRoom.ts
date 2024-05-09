import db from '@/lib/firestore';
import { roomConverter } from '@cred/shared';
import { useMutation } from '@tanstack/react-query';
import { collection, doc, updateDoc } from 'firebase/firestore';

const updateRoom = async (roomId: string, newRoomName: string) => {
  console.log(`Updating room name to ${newRoomName}`);
  // Create the room if it doens't exit
  const roomsRef = doc(
    collection(db, 'rooms').withConverter(roomConverter),
    roomId
  );
  await updateDoc(roomsRef, { name: newRoomName });
};

const useUpdateRoom = () => {
  return useMutation({
    mutationFn: async ({
      roomId,
      newRoomName,
    }: {
      roomId: string;
      newRoomName: string;
    }) => {
      await updateRoom(roomId, newRoomName);
    },
  });
};

export default useUpdateRoom;
