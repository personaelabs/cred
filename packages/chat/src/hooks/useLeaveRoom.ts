import { useMutation, useQueryClient } from '@tanstack/react-query';
import { arrayRemove, doc, updateDoc } from 'firebase/firestore';
import useSignedInUser from './useSignedInUser';
import db from '@/lib/firestore';

const leaveRoom = async ({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) => {
  console.log(`Leaving room ${roomId}`);
  await updateDoc(doc(db, 'rooms', roomId), {
    joinedUserIds: arrayRemove(userId),
  });
};

const useLeaveRoom = () => {
  const queryClient = useQueryClient();

  const { data: signedInUser } = useSignedInUser();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!signedInUser) {
        throw new Error('User not signed in');
      }

      return await leaveRoom({
        roomId,
        userId: signedInUser.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['joined-rooms', { userId: signedInUser!.id }],
      });
    },
  });
};

export default useLeaveRoom;
