import { DocumentData } from 'firebase/firestore';

import { FirestoreTimestamp, Room } from '../types';

export const roomConverter = {
  toFirestore: (room: Room) => {
    return {
      joinedUserIds: room.joinedUserIds,
      readerIds: room.readerIds,
      writerIds: room.writerIds,
      name: room.name,
      imageUrl: room.imageUrl,
      isFeatured: room.isFeatured,
      isHidden: room.isHidden,
      pinnedMessage: room.pinnedMessage,
      isOpenUntil: room.isOpenUntil,
      eligibility: room.eligibility,
    };
  },
  fromFirestore: (snapshot: DocumentData) => {
    const data = snapshot.data();

    const isOpenUntil = data.isOpenUntil
      ? new Date((data.isOpenUntil as FirestoreTimestamp).seconds * 1000)
      : null;

    const room: Room = {
      id: snapshot.id,
      joinedUserIds: data.joinedUserIds,
      readerIds: data.readerIds,
      writerIds: data.writerIds,
      name: data.name,
      imageUrl: data.imageUrl,
      isFeatured: data.isFeatured || false,
      isHidden: data.isHidden || false,
      pinnedMessage: data.pinnedMessage,
      isOpenUntil,
      eligibility: data.eligibility,
    };

    return room;
  },
};
