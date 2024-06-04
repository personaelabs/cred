import {
  UserNotificationTokens,
  notificationTokensConvert,
} from '@cred/shared';
import { useMutation } from '@tanstack/react-query';
import {
  collection,
  doc,
  setDoc,
  arrayUnion,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import db from '@/lib/firestore';
import {
  getDeviceNotificationToken,
  setNotificationConfigured,
} from '@/lib/notification';

const registerNotificationToken = async (userId: string) => {
  const token = await getDeviceNotificationToken();
  if (token) {
    const notificationTokenDoc = doc(
      collection(db, 'notificationTokens').withConverter(
        notificationTokensConvert
      ),
      userId.toString()
    );
    const userTokens = await getDoc(notificationTokenDoc);

    if (userTokens.exists()) {
      const tokenExists = (
        userTokens.data() as UserNotificationTokens
      ).tokens.some(_token => _token.token === token);

      if (tokenExists) {
        // Notification token already exists,
        // just need to update the enabled status
        await updateDoc(notificationTokenDoc, {
          tokens: userTokens
            .data()
            .tokens.map(t =>
              t.token === token
                ? { ...t, createdAt: new Date(), enabled: true }
                : t
            ),
        });
        return;
      }
    } else {
      await setDoc(notificationTokenDoc, {
        userId,
        tokens: [],
      });
    }

    await updateDoc(notificationTokenDoc, {
      userId,
      tokens: arrayUnion({
        token,
        createdAt: new Date(),
        enabled: true,
      }),
    });
  }
};

const useRegisterNotificationToken = () => {
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      await registerNotificationToken(userId);
    },
    onSuccess: () => {
      setNotificationConfigured();
    },
  });
};

export default useRegisterNotificationToken;
