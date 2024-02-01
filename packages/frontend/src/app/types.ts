import { Hex } from 'viem';

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
}

export enum ActionType {
  Post = 'post',
}
export interface ActionSelector {
  action: ActionType;
}

/**
 * Action signed using the Web Crypto API
 */
export interface SignedAction<T extends ActionSelector> {
  sig: Hex;
  pubKey: Hex;
  body: T;
}

export type TweetBody = {
  text: string;
  replyTo?: string;
} & ActionSelector;

/** Private/Public key pair generated using the Web Crypto API  */
export interface UserAccount {
  pubKey: CryptoKey;
  privKey: CryptoKey;
}

export type NewTweetRequestBody = SignedAction<TweetBody>;

export interface NewAttestationRequestBody {
  targetPubKey: Hex;
  targetPubKeySig: Hex;
  sourcePubKeySigHash: Hex;
  proof: Hex;
}
