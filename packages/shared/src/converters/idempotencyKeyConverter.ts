import { SnapshotOptions, DocumentData } from 'firebase/firestore';

import { FirestoreTimestamp, IdempotencyKey } from '../types';

export const idempotencyKeyConverter = {
  toFirestore: (key: IdempotencyKey) => {
    return {
      key: key.key,
      messageCreatedAt: key.messageCreatedAt,
    };
  },
  fromFirestore: (doc: DocumentData, options?: SnapshotOptions) => {
    const data = doc.data(options)!;

    const messageCreatedAt = new Date(
      (data.messageCreatedAt as FirestoreTimestamp).seconds * 1000
    );

    const idempotencyKey: IdempotencyKey = {
      key: data.key,
      messageCreatedAt: messageCreatedAt,
    };

    return idempotencyKey;
  },
};
