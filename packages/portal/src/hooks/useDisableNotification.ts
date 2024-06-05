import db from '@/lib/firestore';
import { notificationTokensConvert } from '@cred/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import useSignedInUser from './useSignedInUser';
import {
  getDeviceNotificationToken,
  saveNotificationEnabled,
} from '@/lib/notification';
import * as messaging from 'firebase/messaging';
import app from '@/lib/firebase';

const deleteNotificationToken = async ({
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
    // Remove the deleted token from the list of users tokens
    tokens: notificationTokens.tokens.filter(t => t.token !== token),
  });
};

const useDisableNotification = () => {
  const { data: signedInUser } = useSignedInUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      saveNotificationEnabled(false);

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

      await deleteNotificationToken({
        userId: signedInUser!.id,
        token,
      });

      await messaging.deleteToken(messaging.getMessaging(app));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['device-notification-token'],
      });
    },
  });
};

export default useDisableNotification;
