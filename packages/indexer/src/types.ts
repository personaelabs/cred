import { HttpTransport, PublicClient } from 'viem';
import * as chains from 'viem/chains';

export type ManagedClient = {
  client: PublicClient<HttpTransport, chains.Chain>;
  id: number;
};

/**
 * A contract group is a group build from a contract.
 * Currently we have two groups: whale and earlyHolder.
 */
export interface ContractGroup {
  contractName: string;
  contractId: number;
  groupHandle: string;
}
