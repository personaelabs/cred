import { useQueries } from '@tanstack/react-query';
import { collection, doc, getDoc } from 'firebase/firestore';
import db from '@/lib/firestore';
import { userConverter } from '@cred/shared';

const getUser = async (userId: string) => {
  const userDoc = doc(
    collection(db, 'users').withConverter(userConverter),
    userId
  );
  const user = (await getDoc(userDoc)).data();

  if (!user) {
    throw new Error(`User with id ${userId} not found`);
  }

  return user;
};

const useUsers = (userIds: string[]) => {
  return useQueries({
    queries: userIds.map(id => ({
      queryKey: ['user',  id],
      queryFn: async () => {
        return await getUser(id);
      },
    })),
  });
};

export default useUsers;