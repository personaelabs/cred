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

  return user || null;
};

const useUsers = (userIds: string[]) => {
  return useQueries({
    queries: userIds.map(id => ({
      queryKey: ['user', { userId: id }],
      queryFn: async () => {
        return await getUser(id);
      },
    })),
    combine: results => {
      return {
        data: results.map(result => result.data).filter(u => u),
        pending: results.some(result => result.isPending),
      };
    },
  });
};

export default useUsers;
