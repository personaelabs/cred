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

export interface FidAttestationRequestBody {
  sourcePubKeySigHash: Hex;
  signInSigNonce: string;
  signInSig: Hex;
  proof: Hex;
  fid: number;
}
