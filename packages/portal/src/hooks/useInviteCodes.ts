import db from '@/lib/firestore';
import settingsKeys from '@/queryKeys/settingsKeys';
import { inviteCodeConverter } from '@cred/shared';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import useSignedInUser from './useSignedInUser';

const getUserInviteCodes = async (userId: string) => {
  const q = query(
    collection(db, 'inviteCodes').withConverter(inviteCodeConverter),
    where('inviterId', '==', userId)
  );

  const docs = await getDocs(q);

  return docs.docs.map(doc => doc.data());
};

const useInviteCodes = () => {
  const { data: signedInUser } = useSignedInUser();

  return useQuery({
    queryKey: settingsKeys.inviteCodes,
    queryFn: async () => {
      if (!signedInUser) {
        throw new Error('User is not signed in');
      }

      const inviteCodes = await getUserInviteCodes(signedInUser.id);
      return inviteCodes;
    },
    enabled: !!signedInUser,
    initialData: [],
  });
};

export default useInviteCodes;
