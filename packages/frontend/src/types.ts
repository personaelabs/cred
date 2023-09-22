import { Hex } from 'viem';

export interface FullProof {
  proof: Hex;
  publicInput: Hex;
  message: string;
}
