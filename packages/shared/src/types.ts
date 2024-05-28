import { FieldValue } from 'firebase/firestore';

export interface User {
  id: string;
  username: string;
  displayName: string;
  pfpUrl: string;
  privyAddress: string;
  connectedAddresses: string[];
  addedCreddd: string[];
  config: {
    notification: {
      mutedRoomIds: string[];
    };
  };
}

export interface UserCreddd {
  userId: string;
  creddd: {
    proof: string;
    privySignature: string;
    groupId: string;
  }[];
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
  display_name: string;
  type_id: string;
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
  visibility: MessageVisibility;
  mentions: string[];
  images: string[];
}

export enum MessageVisibility {
  ONLY_ADMINS = 0,
  PUBLIC = 1,
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

export interface NewRoomNotifyIdempotencyKey {
  key: string;
  createdAt: Date | FirestoreTimestamp;
}

export interface GetGroupMerkleTreeReturnType {
  blockNumber: number;
}
