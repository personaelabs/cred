import { StatusAPIResponse } from '@farcaster/auth-client';

export type SignedInUser = {
  id: string;
} & StatusAPIResponse;

export interface ChatUser {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface ChatMessage {
  id: string;
  replyToId: string | null;
  text: string;
  user: ChatUser;
  createdAt: Date;
}
