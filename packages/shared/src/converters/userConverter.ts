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
      privyAddress: user.privyAddress,
      connectedAddresses: user.connectedAddresses,
      addedCreddd: user.addedCreddd,
      inviteCode: user.inviteCode,
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
      privyAddress: data.privyAddress || '',
      connectedAddresses: data.connectedAddresses || [],
      addedCreddd: data.addedCreddd || [],
      inviteCode: data.inviteCode || '',
    };

    return user;
  },
};
