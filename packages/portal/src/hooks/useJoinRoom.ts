import db from '@/lib/firestore';
import { roomConverter } from '@cred/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { arrayUnion, collection, doc, updateDoc } from 'firebase/firestore';
import useSignedInUser from './useSignedInUser';
import roomKeys from '@/queryKeys/roomKeys';

const joinRoom = async ({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) => {
  const roomRef = doc(
    collection(db, 'rooms').withConverter(roomConverter),
    roomId
  );

  await updateDoc(roomRef, {
    joinedUserIds: arrayUnion(userId),
  });
};

const useJoinRoom = () => {
  const { data: signedInUser } = useSignedInUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (signedInUser) {
        await joinRoom({
          roomId,
          userId: signedInUser.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roomKeys.joinedRooms,
      });

      queryClient.invalidateQueries({
        queryKey: roomKeys.all,
      });
    },
  });
};

export default useJoinRoom;
