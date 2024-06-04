import { MerkleTree } from '@/types';
import {
  MerkleTreeList,
  MerkleTree as MerkleTreeProto,
} from '@/proto/merkle_tree_pb';
import axiosBase from 'axios';

const axios = axiosBase.create({
  baseURL: 'https://creddd.xyz',
});

/**
 * Get the latest Merkle trees of the given group IDs
 * @returns Protocol buffer binary of the Merkle trees
 */
export const getGroupLatestMerkleTree = async (
  groupId: string
): Promise<MerkleTreeProto> => {
  const params = new URLSearchParams();
  params.set('groupIds', groupId);
  const response = await axios.get<ArrayBuffer>(
    `/api/groups?${params.toString()}`,
    {
      responseType: 'arraybuffer',
    }
  );

  const responseBuf = await response.data;

  const merkleTreeList = MerkleTreeList.deserializeBinary(
    new Uint8Array(responseBuf)
  );

  return merkleTreeList.getTreesList()[0];
};

export const getAllMerkleTrees = async () => {
  const merkleTrees = await axios.get<MerkleTree[]>('/api/trees');
  return merkleTrees.data;
};

export default axios;
