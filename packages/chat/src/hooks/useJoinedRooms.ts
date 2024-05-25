import db from '@/lib/firestore';
import { roomConverter } from '@cred/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { useEffect } from 'react';

const getJoinedRooms = async (userId: string) => {
  const q = query(
    collection(db, 'rooms').withConverter(roomConverter),
    where('joinedUserIds', 'array-contains', userId)
  );

  const docs = await getDocs(q);
  const rooms = docs.docs.map(doc => doc.data());
  return rooms;
};

const useJoinedRooms = (userId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (userId) {
      queryClient.invalidateQueries({
        queryKey: ['joined-rooms'],
      });
    }
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ['joined-rooms'],
    queryFn: async () => {
      const rooms = await getJoinedRooms(userId!);
      return rooms;
    },
    enabled: !!userId,
    staleTime: Infinity,
  });
};

export default useJoinedRooms;
