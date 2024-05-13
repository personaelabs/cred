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
import { log } from '@/lib/logger';
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
        console.log('Notification token already registered');
        return;
      }
    } else {
      await setDoc(notificationTokenDoc, {
        userId,
        tokens: [],
      });
    }

    log('Registring notification token');
    console.log('Registring notification token');
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
