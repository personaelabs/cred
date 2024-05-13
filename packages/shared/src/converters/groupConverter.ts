import { SnapshotOptions, DocumentData } from 'firebase/firestore';

import { FirestoreTimestamp, Group } from '../types';

export const groupConverter = {
  toFirestore: (group: Group) => {
    return {
      displayName: group.displayName,
      id: group.id,
      userIds: group.fids,
      updatedAt: group.updatedAt,
    };
  },
  fromFirestore: (doc: DocumentData, options?: SnapshotOptions) => {
    const data = doc.data(options)!;

    const updatedAt = new Date(
      (data.updatedAt as FirestoreTimestamp).seconds * 1000
    );

    const group: Group = {
      displayName: data.displayName,
      id: data.id,
      fids: data.userIds,
      updatedAt,
    };

    return group;
  },
};
