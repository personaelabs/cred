import { StatusAPIResponse } from '@farcaster/auth-client';

export type SignedInUser = StatusAPIResponse;

export interface ChatUser {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  user: ChatUser;
  createdAt: Date;
}
