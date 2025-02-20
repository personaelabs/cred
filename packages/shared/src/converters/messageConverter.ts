import { SnapshotOptions, DocumentData } from 'firebase/firestore';

import { FirestoreTimestamp, Message, MessageVisibility } from '../types';

export const messageConverter = {
  toFirestore: (message: Message) => {
    return {
      roomId: message.roomId,
      userId: message.userId,
      body: message.body,
      createdAt: message.createdAt,
      replyTo: message.replyTo || null,
      mentions: message.mentions,
      images: message.images,
      visibility: message.visibility,
      reactions: message.reactions,
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
      userId: data.userId,
      body: data.body,
      createdAt,
      readBy: data.readBy,
      replyTo: data.replyTo || null,
      mentions: data.mentions || [],
      images: data.images || [],
      visibility: data.visibility || MessageVisibility.ONLY_ADMINS,
      reactions: data.reactions || {},
    };

    return message;
  },
};
