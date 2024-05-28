import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocs, onSnapshot } from 'firebase/firestore';
import { useEffect } from 'react';
import useSignedInUser from './useSignedInUser';
import useRoom from './useRoom';
import { buildMessageQuery } from '@/lib/utils';

export const getRoomLatestMessage = async ({
  isSingedInUserAdmin,
  signedInUserId,
  roomId,
}: {
  isSingedInUserAdmin: boolean;
  signedInUserId: string;
  roomId: string;
}) => {
  const q = buildMessageQuery({
    isAdminView: isSingedInUserAdmin,
    viewerId: signedInUserId,
    roomId,
    pageSize: 1,
  });

  const docs = (await getDocs(q)).docs;
  console.log({ q, isSingedInUserAdmin });

  if (docs.length === 0) {
    return null;
  }

  const message = docs[0].data();
  return message;
};

const useRoomLatestMessage = (roomId: string) => {
  const { data: signedInUser } = useSignedInUser();

  const queryClient = useQueryClient();

  const { data: room } = useRoom(roomId);

  // Hook to listen for changes to the latest message
  // once the component is mounted
  useEffect(() => {
    if (room && signedInUser) {
      const q = buildMessageQuery({
        isAdminView: room.writerIds.includes(signedInUser.id),
        viewerId: signedInUser.id,
        roomId,
        pageSize: 1,
      });

      const unsubscribe = onSnapshot(q, async snapshot => {
        const doc = snapshot.docs[0];
        if (doc) {
          const message = doc.data();
          // Update the cache with the latest message
          queryClient.setQueryData(['latest-message', { roomId }], message);
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [queryClient, room, roomId, signedInUser]);

  return useQuery({
    queryKey: ['latest-message', { roomId }],
    queryFn: async () => {
      const isSingedInUserAdmin = room!.writerIds.includes(signedInUser!.id);

      return await getRoomLatestMessage({
        isSingedInUserAdmin,
        signedInUserId: signedInUser!.id,
        roomId,
      });
    },
    enabled: !!signedInUser && !!room,
  });
};

export default useRoomLatestMessage;
