import db from '@/lib/firestore';
import { roomConverter } from '@cred/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { useEffect } from 'react';

const getRooms = async (userId: string) => {
  const q = query(
    collection(db, 'rooms').withConverter(roomConverter),
    where('fids', 'array-contains', parseInt(userId))
  );

  const docs = await getDocs(q);
  const rooms = docs.docs.map(doc => doc.data());
  return rooms;
};

const useRooms = (userId: string | null) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (userId) {
      queryClient.invalidateQueries({
        queryKey: ['rooms'],
      });
    }
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const rooms = await getRooms(userId!);
      return rooms;
    },
    enabled: !!userId,
    // staleTime: Infinity,
  });
};

export default useRooms;
