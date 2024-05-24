import db from '@/lib/firestore';
import { roomConverter } from '@cred/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query } from 'firebase/firestore';
import { useEffect } from 'react';

const getAllRooms = async () => {
  const q = query(collection(db, 'rooms').withConverter(roomConverter));

  const docs = await getDocs(q);
  const rooms = docs.docs.map(doc => doc.data());
  return rooms;
};

const useAllRooms = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ['all-rooms'],
    });
  }, [queryClient]);

  return useQuery({
    queryKey: ['all-rooms'],
    queryFn: async () => {
      const allRooms = await getAllRooms();
      return allRooms;
    },
    staleTime: Infinity,
    initialData: [],
  });
};

export default useAllRooms;
