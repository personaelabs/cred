import { Hex, HttpTransport, PublicClient } from 'viem';
import * as chains from 'viem/chains';

export type ManagedClient = {
  client: PublicClient<HttpTransport, chains.Chain>;
  id: number;
};

export interface ParsedMerkleProof {
  address: Hex;
  path: Hex[];
  pathIndices: number[];
}
