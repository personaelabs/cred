import { DocumentData } from 'firebase/firestore';
import { FirestoreTimestamp, RoomReadTicket } from '../types';

export const roomReadTicketConverter = {
  toFirestore: (roomReadTicket: RoomReadTicket) => {
    return {
      userId: roomReadTicket.userId,
      latestReadMessageCreatedAt: roomReadTicket.latestReadMessageCreatedAt,
    };
  },
  fromFirestore: (snapshot: DocumentData) => {
    const data = snapshot.data();

    const latestReadMessageCreatedAt = new Date(
      (data.latestReadMessageCreatedAt as FirestoreTimestamp).seconds * 1000
    );

    const room: RoomReadTicket = {
      userId: snapshot.id,
      latestReadMessageCreatedAt,
    };

    return room;
  },
};
