import { useMutation, useQueryClient } from '@tanstack/react-query';
import useSignedInUser from './useSignedInUser';
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  updateDoc,
} from 'firebase/firestore';
import db from '@/lib/firestore';

const toggleMute = async ({
  roomId,
  userId,
  mute,
}: {
  roomId: string;
  userId: string;
  mute: boolean;
}) => {
  const userDocRef = doc(collection(db, 'users'), userId);

  if (mute) {
    await updateDoc(userDocRef, {
      'config.notification.mutedRoomIds': arrayUnion(roomId),
    });
  } else {
    await updateDoc(userDocRef, {
      'config.notification.mutedRoomIds': arrayRemove(roomId),
    });
  }
};

const useToggleMute = () => {
  const queryClient = useQueryClient();

  const { data: signedInUser } = useSignedInUser();

  return useMutation({
    mutationFn: async ({ roomId, mute }: { roomId: string; mute: boolean }) => {
      if (signedInUser) {
        await toggleMute({
          roomId,
          userId: signedInUser.id,
          mute,
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['user', { userId: signedInUser!.id }],
      });
    },
  });
};

export default useToggleMute;
