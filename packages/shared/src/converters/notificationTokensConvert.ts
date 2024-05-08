import { DocumentData } from 'firebase/firestore';

import { FirestoreTimestamp, UserNotificationTokens } from '../types';

export const notificationTokensConvert = {
  toFirestore: (token: UserNotificationTokens) => {
    return {
      fid: token.fid,
      tokens: token.tokens,
    };
  },
  fromFirestore: (snapshot: DocumentData) => {
    const data = snapshot.data();

    const tokens = (data.tokens as UserNotificationTokens['tokens']).map(
      token => {
        /*
        const createdAt = token.createdAt
              ? new Date(
                  (token.createdAt as FirestoreTimestamp).seconds * 1000
                )
              : new Date();
            */

        const createdAt = new Date(
          (token.createdAt as FirestoreTimestamp).seconds * 1000
        );

        return {
          token: token.token,
          createdAt,
        };
      }
    );

    const userTokens: UserNotificationTokens = {
      fid: data.fid,
      tokens,
    };

    return userTokens;
  },
};
