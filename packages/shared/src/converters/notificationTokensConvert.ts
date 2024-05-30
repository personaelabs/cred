import { DocumentData } from 'firebase/firestore';

import { FirestoreTimestamp, UserNotificationTokens } from '../types';

export const notificationTokensConvert = {
  toFirestore: (token: UserNotificationTokens) => {
    return {
      userId: token.userId,
      tokens: token.tokens,
    };
  },
  fromFirestore: (snapshot: DocumentData) => {
    const data = snapshot.data();

    const tokens = (data.tokens as UserNotificationTokens['tokens']).map(
      token => {
        const createdAt = new Date(
          (token.createdAt as FirestoreTimestamp).seconds * 1000
        );

        return {
          token: token.token,
          createdAt,
          enabled: token.enabled !== false ? true : false,
        };
      }
    );

    const userTokens: UserNotificationTokens = {
      userId: data.userId,
      tokens,
    };

    return userTokens;
  },
};
