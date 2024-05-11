import db from '@/lib/firestore';
import { roomConverter } from '@cred/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

const useUpdateRoom = (roomId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ newRoomName }: { newRoomName: string }) => {
      await updateRoom(roomId, newRoomName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', { roomId }] });
    },
  });
};

export default useUpdateRoom;
