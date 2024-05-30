import { UserNotificationTokens } from '@cred/shared';
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
  requestNotificationToken,
  setNotificationConfigured,
} from '@/lib/notification';

const registerNotificationToken = async (userId: string) => {
  const token = await requestNotificationToken();
  if (token) {
    const notificationTokenDoc = doc(
      collection(db, 'notificationTokens'),
      userId.toString()
    );
    const userTokens = await getDoc(notificationTokenDoc);

    if (userTokens.exists()) {
      const tokenExists = (
        userTokens.data() as UserNotificationTokens
      ).tokens.some(_token => _token.token === token);

      if (tokenExists) {
        // Notification token already exists
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
