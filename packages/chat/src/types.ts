import { StatusAPIResponse } from '@farcaster/auth-client';
import { Hex } from 'viem';

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

/**
 * Request body of POST /api/attestations
 */
export interface FidAttestationRequestBody {
  groupId: string;
  proof: Hex;
  siwfResponse: StatusAPIResponse;
}

export interface UserCredddResponse {
  groups: {
    id: string;
    typeId: string;
    displayName: string;
  }[];
  score: number;
}
