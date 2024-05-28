import axios, { AxiosInstance } from 'axios';
import { GetGroupMerkleTreeReturnType, Group } from './types';

export const createRpcClient = (rpcUrl: string) => new JsonRpcClient(rpcUrl);

class JsonRpcClient {
  private axiosInstance: AxiosInstance;

  constructor(rpcUrl: string) {
    this.axiosInstance = axios.create({
      baseURL: rpcUrl,
    });
  }

  private async call<T>(method: string, params: any[] = []): Promise<T> {
    const response = await this.axiosInstance.post<{ result: T }>(
      '',
      {
        jsonrpc: '2.0',
        method,
        params,
        id: 1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.result;
  }

  /**
   * Returns the ids of group the address belongs to
   */
  public async getAddressGroups(address: `0x${string}`): Promise<Group[]> {
    return await this.call<Group[]>('getAddressGroups', [address]);
  }

  public async getGroupByMerkleRoot(merkleRoot: `0x${string}`): Promise<Group> {
    return await this.call<Group>('getGroupByMerkleRoot', [merkleRoot]);
  }

  public async getGroupMerkleTree({
    groupId,
    merkleRoot,
  }: {
    groupId: string;
    merkleRoot: string;
  }): Promise<GetGroupMerkleTreeReturnType> {
    return await this.call<GetGroupMerkleTreeReturnType>('getGroupMerkleTree', [
      merkleRoot,
      groupId,
    ]);
  }
}
