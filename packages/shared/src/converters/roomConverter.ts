import { DocumentData } from 'firebase/firestore';

import { Room } from '../types';

export const roomConverter = {
  toFirestore: (room: Room) => {
    return {
      fids: room.fids,
      invitedFids: room.invitedFids,
      name: room.name,
      imageUrl: room.imageUrl,
      adminFids: room.adminFids,
    };
  },
  fromFirestore: (snapshot: DocumentData) => {
    const data = snapshot.data();

    const room: Room = {
      id: snapshot.id,
      fids: data.fids,
      invitedFids: data.invitedFids,
      name: data.name,
      imageUrl: data.imageUrl,
      adminFids: data.adminFids,
    };

    return room;
  },
};
