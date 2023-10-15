import { Hex } from 'viem';

export interface SubmitData {
  proof: Hex;
  message: string;
}

export interface FcAnonWitnessInput {
  sFc: Uint8Array;
  s: Uint8Array;
  r: Uint8Array;
  isYOdd: boolean;
  msgHash: Uint8Array;
  siblings: Uint8Array;
  indices: Uint8Array;
  root: Uint8Array;
}

export interface WitnessInput {
  s: Uint8Array;
  r: Uint8Array;
  isYOdd: boolean;
  msgHash: Uint8Array;
  siblings: Uint8Array;
  indices: Uint8Array;
  root: Uint8Array;
}

export interface PublicInput {
  r: Uint8Array;
  isYOdd: boolean;
  msgHash: Uint8Array;
  siblings: Uint8Array;
  indices: Uint8Array;
  root: Uint8Array;
}

export interface MerkleProof {
  root: bigint;
  pathIndices: number[];
  siblings: [bigint][];
}

type ProofVersion = 'v1' | 'v2' | 'v3';

export interface FullProof {
  proof: Hex;
  publicInput: Hex;
  message: string;
  proofVersion: ProofVersion;
}
