import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Firestore, arrayRemove, doc, updateDoc } from 'firebase/firestore';
import useSignedInUser from './useSignedInUser';
import db from '@/lib/firestore';

const leaveRoom = async (db: Firestore, roomId: string, fid: number) => {
  console.log(`Leaving room ${roomId} with fid ${fid}`);
  await updateDoc(doc(db, 'rooms', roomId), {
    fids: arrayRemove(fid),
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

      return await leaveRoom(db, roomId, signedInUser.fid!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export default useLeaveRoom;
