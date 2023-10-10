import { Hex } from 'viem';

type ProofVersion = 'v1' | 'v2';

export interface FullProof {
  proof: Hex;
  publicInput: Hex;
  message: string;
  proofVersion: ProofVersion;
}
