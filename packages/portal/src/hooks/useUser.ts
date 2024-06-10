import db from '@/lib/firestore';
import userKeys from '@/queryKeys/userKeys';
import { userConverter } from '@cred/shared';
import { useQuery } from '@tanstack/react-query';
import { collection, getDoc, doc } from 'firebase/firestore';

const getUser = async (userId: string) => {
  const userDocRef = doc(
    collection(db, 'users').withConverter(userConverter),
    userId
  );

  const userDoc = await getDoc(userDocRef);
  return userDoc.data() || null;
};

const useUser = (userId: string | null) => {
  return useQuery({
    queryKey: userKeys.user(userId),
    queryFn: async () => {
      if (!userId) return null;

      const user = await getUser(userId!);
      return user;
    },
  });
};

export default useUser;
