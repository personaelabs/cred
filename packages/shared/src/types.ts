import { FieldValue } from 'firebase/firestore';

export interface UserNotificationTokens {
  fid: number;
  tokens: {
    token: string;
    createdAt: Date | FirestoreTimestamp;
  }[];
}

export interface NeynarUserResponse {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

export interface LoginResponse {
  token: string;
}

export interface SuggestedUsersJsonResponse {
  creddd: string[];
  groupIds: string[];
  fid: number;
  score: number;
}
[];

export interface User {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  updatedAt: Date | FirestoreTimestamp;
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
  fid: number;
  body: string;
  createdAt: FirestoreTimestamp | FieldValue | Date | null;
  readBy: number[];
  replyTo: string | null;
}

export interface Room {
  id: string;
  name: string;
  fids: number[];
  invitedFids: number[];
  imageUrl: string | null;
  adminFids: number[];
}
