// Types of documents stored in Firestore

import { FieldValue } from 'firebase/firestore';

export interface User {
  id: string;
  username: string;
  displayName: string;
  pfpUrl: string;
  privyAddress: string;
  connectedAddresses: string[];
  addedCreddd: string[];
  inviteCode: string;
  config: {
    notification: {
      mutedRoomIds: string[];
    };
  };
  isMod: boolean;
}

export interface UserCreddd {
  userId: string;
  creddd: {
    proof: string;
    privySignature: string;
    groupId: string;
  }[];
}

export interface InviteCode {
  code: string;
  isUsed: boolean;
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
  reactions: {
    [key: string]: string;
  };
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
  isFeatured: boolean;
  isHidden: boolean;
  pinnedMessage: string | null;
  isOpenUntil: Date | null;
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
