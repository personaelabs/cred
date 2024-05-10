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

const registerNotificationToken = async (fid: number, token: string) => {
  const notificationTokenDoc = doc(
    collection(db, 'notificationTokens'),
    fid.toString()
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
      fid,
      tokens: [],
    });
  }

  log('Registring notification token');
  console.log('Registring notification token');
  await updateDoc(notificationTokenDoc, {
    fid,
    tokens: arrayUnion({
      token,
      createdAt: new Date(),
    }),
  });

  alert('Notification token registered');
};

const useRegisterNotificationToken = () => {
  return useMutation({
    mutationKey: ['register-notification-token'],
    mutationFn: async ({ fid, token }: { fid: number; token: string }) => {
      await registerNotificationToken(fid, token);
    },
  });
};

export default useRegisterNotificationToken;
