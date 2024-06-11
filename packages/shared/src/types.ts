import { Group } from './firestoreTypes';

export * from './firestoreTypes';

export interface GetGroupMerkleTreeReturnType {
  blockNumber: number;
}

export interface GetCredddReturnType {
  id: string;
  display_name: string;
  type_id: string;
}

export interface MerkleTreeWithBloomFilter {
  id: number;
  bloom_filter: Uint8Array;
  bloom_sip_keys: Uint8Array[];
  bloom_num_hashes: number;
  bloom_num_bits: number;
  group: Group;
}

export type GetLatestMerkleTreesReturnType = MerkleTreeWithBloomFilter[];
