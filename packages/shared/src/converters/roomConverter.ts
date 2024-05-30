import { DocumentData } from 'firebase/firestore';

import { Room } from '../types';

export const roomConverter = {
  toFirestore: (room: Room) => {
    return {
      joinedUserIds: room.joinedUserIds,
      readerIds: room.readerIds,
      writerIds: room.writerIds,
      name: room.name,
      imageUrl: room.imageUrl,
      isFeatured: room.isFeatured,
    };
  },
  fromFirestore: (snapshot: DocumentData) => {
    const data = snapshot.data();

    const room: Room = {
      id: snapshot.id,
      joinedUserIds: data.joinedUserIds,
      readerIds: data.readerIds,
      writerIds: data.writerIds,
      name: data.name,
      imageUrl: data.imageUrl,
      isFeatured: data.isFeatured || false,
    };

    return room;
  },
};
