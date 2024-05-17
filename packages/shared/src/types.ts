import { FieldValue } from 'firebase/firestore';

export interface User {
  id: string;
  username: string;
  displayName: string;
  pfpUrl: string;
  privyAddress: string;
  config: {
    notification: {
      mutedRoomIds: string[];
    };
  };
}

export interface UserNotificationTokens {
  userId: string;
  tokens: {
    token: string;
    createdAt: Date | FirestoreTimestamp;
  }[];
}

export interface Group {
  id: string;
  displayName: string;
  fids: number[];
  updatedAt: Date | FirestoreTimestamp;
}

export interface FirestoreTimestamp {
  nanoseconds: number;
  seconds: number;
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  body: string;
  createdAt: FirestoreTimestamp | FieldValue | Date | null;
  readBy: number[];
  replyTo: string | null;
  mentions: string[];
}

export interface Room {
  id: string;
  name: string;
  joinedUserIds: string[];
  readerIds: string[];
  writerIds: string[];
  imageUrl: string | null;
}

export interface RoomReadTicket {
  userId: string;
  latestReadMessageCreatedAt: Date | FirestoreTimestamp;
}

export interface IdempotencyKey {
  key: string;
  messageCreatedAt: Date | FirestoreTimestamp;
}
