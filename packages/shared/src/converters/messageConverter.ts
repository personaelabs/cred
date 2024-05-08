import { SnapshotOptions, DocumentData } from 'firebase/firestore';

import { FirestoreTimestamp, Message } from '../types';

export const messageConverter = {
  toFirestore: (message: Message) => {
    return {
      roomId: message.roomId,
      fid: message.fid,
      body: message.body,
      createdAt: message.createdAt,
    };
  },
  fromFirestore: (doc: DocumentData, options?: SnapshotOptions) => {
    const data = doc.data(options)!;

    const createdAt = data.createdAt
      ? new Date((data.createdAt as FirestoreTimestamp).seconds * 1000)
      : null;

    const message: Message = {
      id: doc.id,
      roomId: data.roomId,
      fid: data.fid,
      body: data.body,
      createdAt,
      readBy: data.readBy,
    };

    return message;
  },
};
