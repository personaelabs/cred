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

      const confirmed = await window.confirm('Leave room?');
      if (confirmed) {
        await leaveRoom({
          roomId,
          userId: signedInUser.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['joined-rooms'],
      });
    },
  });
};

export default useLeaveRoom;
