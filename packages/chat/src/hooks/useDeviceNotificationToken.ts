import db from '@/lib/firestore';
import { notificationTokensConvert } from '@cred/shared';
import { useQuery } from '@tanstack/react-query';
import { collection, doc, getDoc } from 'firebase/firestore';
import useSignedInUser from './useSignedInUser';
import { getDeviceNotificationToken } from '@/lib/notification';

/**
 * Get all registered notification tokens for a user.
 */
const getUserNotificationTokens = async (userId: string) => {
  const notificationTokensDoc = doc(
    collection(db, 'notificationTokens').withConverter(
      notificationTokensConvert
    ),
    userId
  );

  const notificationTokens = (await getDoc(notificationTokensDoc)).data();
  return notificationTokens?.tokens || [];
};

const useDeviceNotificationToken = () => {
  const { data: signedInUser } = useSignedInUser();
  return useQuery({
    queryKey: ['device-notification-token'],
    queryFn: async () => {
      const userTokens = await getUserNotificationTokens(signedInUser!.id);

      // Get the notification no this device if the user has granted permission
      const deviceToken =
        Notification.permission === 'granted'
          ? await getDeviceNotificationToken()
          : null;

      // Find the Firestore document for the device token
      // and return it if it exists
      return deviceToken
        ? userTokens.find(token => token.token === deviceToken) || null
        : null;
    },
    enabled: !!signedInUser,
  });
};

export default useDeviceNotificationToken;
