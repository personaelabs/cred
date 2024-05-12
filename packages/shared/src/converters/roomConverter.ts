import { DocumentData } from 'firebase/firestore';

import { Room } from '../types';

export const roomConverter = {
  toFirestore: (room: Room) => {
    return {
      userIds: room.userIds,
      invitedUserIds: room.invitedUserIds,
      name: room.name,
      imageUrl: room.imageUrl,
      adminUserIds: room.adminUserIds,
    };
  },
  fromFirestore: (snapshot: DocumentData) => {
    const data = snapshot.data();

    const room: Room = {
      id: snapshot.id,
      userIds: data.userIds,
      invitedUserIds: data.invitedUserIds,
      name: data.name,
      imageUrl: data.imageUrl,
      adminUserIds: data.adminUserIds,
    };

    return room;
  },
};
