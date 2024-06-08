import { GetLogsReturnType, Hex } from 'viem';
import { User as PrivyUser } from '@privy-io/react-auth';
import { TRANSFER_SINGLE_EVENT } from './lib/contract';
import { MessageVisibility, User } from '@cred/shared';

export type SignedInUser = PrivyUser;

/**
 * User object used to render a single chat message
 */
export interface ChatUser {
  id: string;
  name: string;
  avatarUrl: string;
  isMod: boolean;
}

export interface MessageWithUserData {
  id: string;
  replyToId: string | null;
  text: string;
  images: string[];
  user: ChatUser;
  createdAt: Date;
  visibility: MessageVisibility;
  reactions: Record<string, string>;
}

export interface MerkleTree {
  id: number;
  bloomFilter: Buffer | null;
  treeProtoBuf?: Buffer;
  bloomSipKeys?: Buffer[];
  bloomNumHashes?: number;
  bloomNumBits?: number;
  Group: {
    id: string;
    displayName: string;
    score: number;
  };
}

export interface MerkleProof {
  root: Uint8Array;
  path: Hex[];
  pathIndices: number[];
}

export type EligibleCreddd = MerkleTree['Group'] & {
  address: Hex;
  merkleProof: MerkleProof;
};

/**
 * Witness to pass to the prover
 */
export interface WitnessInput {
  s: Uint8Array;
  r: Uint8Array;
  isYOdd: boolean;
  msgHash: Uint8Array;
  siblings: Uint8Array;
  indices: Uint8Array;
  root: Uint8Array;
  signInSigS: Uint8Array;
}

export interface MessageInput {
  message: string;
  mentions: string[];
  replyTo: string | null;
  imageUris: string[];
}

export type TradeLog = GetLogsReturnType<typeof TRANSFER_SINGLE_EVENT>[number];

export interface NeynarUserResponse {
  fid: number;
  username: string;
  display_name: string;
  active_status: string;
  pfp_url: string;
  verified_addresses: {
    eth_addresses: Hex[];
  };
  custody_address: Hex;
}

export enum ModalType {
  // eslint-disable-next-line no-unused-vars
  MESSAGE_AS_BUYER = 'MESSAGE_AS_BUYER',
  // eslint-disable-next-line no-unused-vars
  REPLY_AS_ADMIN = 'REPLY_AS_ADMIN',
}

export enum MobileOS {
  // eslint-disable-next-line no-unused-vars
  IOS = 'IOS',
  // eslint-disable-next-line no-unused-vars
  ANDROID = 'ANDROID',
  // eslint-disable-next-line no-unused-vars
  WINDOWS = 'WINDOWS',
}

/**
 * Request body for the /api/creddd endpoint
 */
export interface AddCredddRequestBody {
  proof: Hex;
  privyAddress: Hex;
  privyAddressSignature: Hex;
}

/**
 * Request body for the /api/users/{userId} endpoint
 */
export interface SetUsernameRequestBody {
  username: string;
}

/**
 * Request body for the /api/rooms/{roomId}/sync endpoint
 */
export interface SyncRoomRequestBody {
  txHash: Hex; // The transaction hash of the trade that will add or remove the user from a room
}

/**
 * Request body for the /api/connected-addresses endpoint
 */
export interface ConnectAddressRequestBody {
  address: Hex;
  signature: Hex;
  groupIds: string[]; // Temporary
}

export interface SignInResponse {
  token: string;
  user: User | null;
}
