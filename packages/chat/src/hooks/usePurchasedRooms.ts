import db from '@/lib/firestore';
import { roomConverter } from '@cred/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect } from 'react';

const getPurchasedRooms = async (userId: string) => {
  const q = query(
    collection(db, 'rooms').withConverter(roomConverter),
    where('readerIds', 'array-contains', userId)
  );

  const docs = await getDocs(q);

  const rooms = docs.docs.map(doc => doc.data());

  return rooms;
};

const usePurchasedRooms = (userId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['purchased-rooms'] });
  }, [queryClient]);

  return useQuery({
    queryKey: ['purchased-rooms'],
    queryFn: async () => {
      const purchasedRooms = await getPurchasedRooms(userId!);

      return purchasedRooms;
    },
    staleTime: Infinity,
    initialData: [],
    enabled: !!userId,
  });
};

export default usePurchasedRooms;
