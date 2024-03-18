import { MerkleTreeSelect } from '@/app/api/trees/route';
import {
  PRECOMPUTED_HASHES,
  captureFetchError,
  fromHexString,
  toHexString,
} from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Hex, hexToBytes } from 'viem';
import { EligibleGroup, MerkleProof } from '@/app/types';
import { MerkleTree } from '@/proto/merkle_tree_pb';

/**
 * Get the latest Merkle tree for a group from the server
 * @param groupId The ID of the group
 * @returns The tree ID and the Merkle tree protobuf
 */
const getMerkleTree = async (
  groupId: number
): Promise<{
  treeId: number;
  merkleTree: MerkleTree;
}> => {
  const response = await fetch(`/api/groups/${groupId}/merkle-tree`);

  if (!response.ok) {
    await captureFetchError(response);
    throw new Error('Failed to fetch merkle tree');
  }

  const responseBuf = await response.arrayBuffer();

  const treeId = Buffer.from(responseBuf.slice(0, 4)).readUInt32BE();
  const merkleTreeBytes = responseBuf.slice(4, responseBuf.byteLength);

  const merkleTree = MerkleTree.deserializeBinary(
    new Uint8Array(merkleTreeBytes)
  );

  return { treeId, merkleTree };
};

/**
 * Get the Merkle pro of for an address. Returns null if the address is not in the tree.
 */
const getMerkleProof = (
  merkleTree: MerkleTree,
  address: Hex
): MerkleProof | null => {
  const layers = merkleTree.getLayersList();
  const treeDepth = layers.length;

  // Get the leaves of the tree
  const leaves = layers[0].getNodesList();

  // Convert the address to a buffer
  const addressBuffer = fromHexString(address, 20);

  // Find the leaf index
  const leafNode = leaves.find(leaf => {
    const leafBytes = leaf.getNode_asU8();
    return addressBuffer.equals(Buffer.from(leafBytes));
  });

  if (!leafNode) {
    return null;
  }

  let leafIndex = leafNode.getIndex();

  // Get the merkle proof
  const siblings = [];
  const pathIndices = [];

  for (let i = 0; i < treeDepth - 1; i++) {
    const layer = layers[i];
    const siblingIndex = leafIndex % 2 === 0 ? leafIndex + 1 : leafIndex - 1;

    const sibling =
      (layer
        .getNodesList()
        .find(node => node.getIndex() === siblingIndex)
        ?.getNode() as Uint8Array) || PRECOMPUTED_HASHES[i];

    siblings.push(sibling);
    pathIndices.push(leafIndex & 1);

    leafIndex = Math.floor(leafIndex / 2);
  }

  const root = layers[treeDepth - 1].getNodesList()[0].getNode_asU8();

  return {
    root,
    path: siblings.map(sibling => toHexString(sibling)),
    pathIndices,
  };
};

/**
 *  Get the eligible groups for a set of addresses
 */
const useEligibleGroups = (addresses: Hex[] | null) => {
  const [merkleTrees, setMerkleTrees] = useState<MerkleTreeSelect[] | null>(
    null
  );
  const [eligibleGroups, setEligibleGroups] = useState<EligibleGroup[] | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const result = await fetch(`/api/trees`);

      if (result.ok) {
        const _merkleTrees = (await result.json()) as MerkleTreeSelect[];
        setMerkleTrees(_merkleTrees);
      } else {
        toast.error('Failed to fetch merkle trees');
        await captureFetchError(result);
      }
    })();
  }, []);

  const searchEligibleGroups = useCallback(async () => {
    // Search for the eligible groups once the addresses and groups are available
    if (addresses && merkleTrees) {
      // @ts-ignore
      const circuit = await import('circuit-web');
      circuit.init_panic_hook();

      const _eligibleGroups = [];
      // We use a set to track unique groups
      const uniqueGroups = new Set<number>();

      for (const address of addresses) {
        for (const merkleTree of merkleTrees) {
          if (
            merkleTree.bloomFilter &&
            merkleTree.bloomNumBits &&
            merkleTree.bloomNumHashes &&
            merkleTree.bloomSipKeys
          ) {
            const sipKeys = Buffer.concat([
              Buffer.from(merkleTree.bloomSipKeys[0]),
              Buffer.from(merkleTree.bloomSipKeys[1]),
            ]);

            const addressBytes = hexToBytes(address);

            // Check if the address is a member using the bloom filter
            const isMember = circuit.bloom_check(
              // @ts-ignore
              merkleTree.bloomFilter.data,
              BigInt(merkleTree.bloomNumBits),
              merkleTree.bloomNumHashes,
              sipKeys,
              addressBytes
            );

            if (isMember) {
              const group = merkleTree.Group;
              // Get the merkle tree for the group
              const treeProtoBuf = await getMerkleTree(group.id);

              // Try getting the merkle proof for the address
              const merkleProof = getMerkleProof(
                treeProtoBuf.merkleTree,
                address
              );

              if (merkleProof) {
                if (!uniqueGroups.has(group.id)) {
                  uniqueGroups.add(group.id);
                  _eligibleGroups.push({
                    ...group,
                    address,
                    merkleProof,
                    treeId: merkleTree.id,
                  });
                }
              } else {
                // Bloom filter false positives
                console.log('Bloom filter false positive');
              }
            }
          }
        }
      }

      setEligibleGroups(_eligibleGroups);
    }
  }, [addresses, merkleTrees]);

  useEffect(() => {
    searchEligibleGroups();
  }, [addresses, searchEligibleGroups]);

  return eligibleGroups;
};

export default useEligibleGroups;
