import db from '@/lib/firestore';
import { roomConverter } from '@cred/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect } from 'react';

const getEligibleRooms = async (userId: string) => {
  const q = query(
    collection(db, 'rooms').withConverter(roomConverter),
    where('writerIds', 'array-contains', userId)
  );

  const docs = await getDocs(q);

  const rooms = docs.docs.map(doc => doc.data());

  return rooms;
};

const useEligibleRooms = (userId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ['eligible-rooms'],
    });
  }, [queryClient, userId]);

  return useQuery({
    queryKey: ['eligible-rooms'],
    queryFn: async () => {
      const eligibleRooms = await getEligibleRooms(userId!);

      return eligibleRooms;
    },
    staleTime: Infinity,
    initialData: [],
    enabled: !!userId,
  });
};

export default useEligibleRooms;
