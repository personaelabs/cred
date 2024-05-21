import { SnapshotOptions, DocumentData } from 'firebase/firestore';

import { FirestoreTimestamp, NewRoomNotifyIdempotencyKey } from '../types';

export const newRoomNotifyIdempotencyKeyConverter = {
  toFirestore: (key: NewRoomNotifyIdempotencyKey) => {
    return {
      key: key.key,
      createdAt: key.createdAt,
    };
  },
  fromFirestore: (doc: DocumentData, options?: SnapshotOptions) => {
    const data = doc.data(options)!;

    const createdAt = new Date(
      (data.createdAt as FirestoreTimestamp).seconds * 1000
    );

    const idempotencyKey: NewRoomNotifyIdempotencyKey = {
      key: data.key,
      createdAt: createdAt,
    };

    return idempotencyKey;
  },
};
