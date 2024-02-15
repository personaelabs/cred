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
  signInSigS: Uint8Array;
}

/**
 * Request body of POST /api/attestations
 */
export interface FidAttestationRequestBody {
  sourcePubKeySigHash: Hex;
  signInSigNonce: string;
  signInSigS: Hex;
  proof: Hex;
  fid: number;
}

export interface NeynarUserResponse {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}
