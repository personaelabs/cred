import { useQueries } from '@tanstack/react-query';
import { collection, doc, getDoc } from 'firebase/firestore';
import db from '@/lib/firestore';
import { userConverter, User } from '@cred/shared';
import userKeys from '@/queryKeys/userKeys';

const getUser = async (userId: string) => {
  const userDoc = doc(
    collection(db, 'users').withConverter(userConverter),
    userId
  );
  const user = (await getDoc(userDoc)).data();

  return user || null;
};

const useUsers = (userIds: string[]) => {
  return useQueries({
    queries: userIds.map(id => ({
      queryKey: userKeys.user(id),
      queryFn: async () => {
        return await getUser(id);
      },
    })),
    combine: results => {
      return {
        data: results.map(result => result.data).filter(u => u) as User[],
        pending: results.some(result => result.isPending),
      };
    },
  });
};

export default useUsers;
