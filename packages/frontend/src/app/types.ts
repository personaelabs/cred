import { Hex } from 'viem';

export interface WitnessInput {
  s: Uint8Array;
  r: Uint8Array;
  isYOdd: boolean;
  msgHash: Uint8Array;
  siblings: Uint8Array;
  indices: Uint8Array;
  root: Uint8Array;
}

export enum ActionType {
  Post = 'post',
}
export interface ActionSelector {
  action: ActionType;
}

export interface Action<T extends ActionSelector> {
  sig: Hex;
  pubKey: Hex;
  body: T;
}

export type PostBody = {
  text: string;
  replyTo?: string;
} & ActionSelector;

export type PostRequestBody = Action<PostBody> & {
  username: string;
};

export interface VerifyRequestBody {
  targetPubKey: Hex;
  targetPubKeySig: Hex;
  sourcePubKeySigHash: Hex;
  proof: Hex;
}

export interface UserAccount {
  pubKey: CryptoKey;
  privKey: CryptoKey;
}
