import db from '@/lib/firestore';
import { notificationTokensConvert } from '@cred/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import useSignedInUser from './useSignedInUser';
import { getDeviceNotificationToken } from '@/lib/notification';

const disableNotificationToken = async ({
  userId,
  token,
}: {
  userId: string;
  token: string;
}) => {
  const notificationTokenDoc = doc(
    collection(db, 'notificationTokens').withConverter(
      notificationTokensConvert
    ),
    userId
  );

  const notificationTokens = (await getDoc(notificationTokenDoc)).data();

  if (!notificationTokens) {
    throw new Error('Notification tokens not found');
  }

  await updateDoc(notificationTokenDoc, {
    tokens: notificationTokens.tokens.map(t =>
      t.token === token ? { ...t, enabled: false } : t
    ),
  });
};

const useDisableNotification = () => {
  const { data: signedInUser } = useSignedInUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!signedInUser) {
        throw new Error('User not signed in');
      }

      if (Notification.permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      const token = await getDeviceNotificationToken();

      if (!token) {
        throw new Error('Notification token not found');
      }

      await disableNotificationToken({
        userId: signedInUser!.id,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['device-notification-token'],
      });
    },
  });
};

export default useDisableNotification;
