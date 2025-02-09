import { app } from '@cred/firebase-admin';
import {
  UserNotificationTokens,
  notificationTokensConvert,
} from '@cred/shared';
import { getFirestore } from 'firebase-admin/firestore';
import logger from './logger';

const db = getFirestore(app);

export const notificationTokens = new Map<
  string,
  UserNotificationTokens['tokens']
>();

export const startNotificationTokensSync = () => {
  const unsubscribe = db
    .collection('notificationTokens')
    .withConverter(notificationTokensConvert)
    .onSnapshot(snapshot => {
      snapshot.docs.forEach(async doc => {
        const data = doc.data();

        logger.debug(`Found notification token for ${data.userId}`);
        notificationTokens.set(data.userId, data.tokens);
      });
    });

  process.on('exit', () => {
    unsubscribe();
  });
};
