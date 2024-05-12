import { SnapshotOptions, DocumentData } from 'firebase/firestore';
import { User } from '../types';

export const userConverter = {
  toFirestore: (user: User) => {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      pfpUrl: user.pfpUrl,
    };
  },
  fromFirestore: (doc: DocumentData, options?: SnapshotOptions) => {
    const data = doc.data(options)!;

    const user: User = {
      id: data.id,
      username: data.username,
      displayName: data.displayName,
      pfpUrl: data.pfpUrl,
    };

    return user;
  },
};
