import { SnapshotOptions, DocumentData } from 'firebase/firestore';

import { FirestoreTimestamp, User } from '../types';

export const userConverter = {
  toFirestore: (user: User) => {
    return {
      fid: user.fid,
      username: user.username,
      displayName: user.displayName,
      pfpUrl: user.pfpUrl,
      updatedAt: user.updatedAt,
    };
  },
  fromFirestore: (doc: DocumentData, options?: SnapshotOptions) => {
    const data = doc.data(options)!;

    const updatedAt = data.updatedAt
      ? new Date((data.updatedAt as FirestoreTimestamp).seconds * 1000)
      : new Date();

    const user: User = {
      fid: data.fid,
      username: data.username,
      displayName: data.displayName,
      pfpUrl: data.pfpUrl,
      updatedAt,
    };

    return user;
  },
};
