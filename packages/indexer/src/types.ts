import { Group } from '@prisma/client';
import { Hex, HttpTransport, PublicClient } from 'viem';
import * as chains from 'viem/chains';

export type GroupMeta = Pick<Group, 'handle' | 'displayName'>;

export type GetQualifiedAddresses = () => Promise<Hex[]>;

export type GroupSpec = {
  group: GroupMeta;
  resolveMembers: GetQualifiedAddresses;
};

export type ManagedClient = {
  client: PublicClient<HttpTransport, chains.Chain>;
  id: number;
};

export interface BadgeHolderAttestation {
  recipient: Hex;
}

export interface OpDelegateQueryResult {
  delegate: Hex;
  newBalance: number;
}
