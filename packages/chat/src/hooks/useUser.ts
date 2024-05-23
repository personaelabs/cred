import db from '@/lib/firestore';
import { userConverter } from '@cred/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDoc, doc } from 'firebase/firestore';
import { useEffect } from 'react';

const getUser = async (userId: string) => {
  const roomDocRef = doc(
    collection(db, 'users').withConverter(userConverter),
    userId
  );

  const roomDoc = await getDoc(roomDocRef);
  return roomDoc.data();
};

const useUser = (userId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (userId) {
      queryClient.invalidateQueries({
        queryKey: ['user', { userId }],
      });
    }
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ['user', { userId }],
    queryFn: async () => {
      if (!userId) return null;

      const user = await getUser(userId!);
      return user;
    },
    staleTime: Infinity,
  });
};

export default useUser;
