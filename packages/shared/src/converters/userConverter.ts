import { SnapshotOptions, DocumentData } from 'firebase/firestore';
import { User } from '../types';

const defaultConfig: User['config'] = {
  notification: {
    mutedRoomIds: [],
  },
};

export const userConverter = {
  toFirestore: (user: User) => {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      pfpUrl: user.pfpUrl,
      config: user.config,
    };
  },
  fromFirestore: (doc: DocumentData, options?: SnapshotOptions) => {
    const data = doc.data(options)!;

    const user: User = {
      id: data.id,
      username: data.username,
      displayName: data.displayName,
      pfpUrl: data.pfpUrl,
      config: data.config || defaultConfig,
    };

    return user;
  },
};
