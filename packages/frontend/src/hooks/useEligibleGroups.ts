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
import { MerkleTree, MerkleTreeList } from '@/proto/merkle_tree_pb';

const MAX_TREES_PRE_REQUEST = 5;

/**
 * Get the bodies of given Merkle trees IDs
 * @returns Protocol buffer binary of the Merkle trees
 */
const getMerkleTrees = async (treeIds: number[]): Promise<MerkleTreeList> => {
  const params = new URLSearchParams();
  params.set('ids', treeIds.join(','));
  const response = await fetch(`/api/trees-protobufs?${params.toString()}`);

  if (!response.ok) {
    await captureFetchError(response);
    throw new Error('Failed to fetch merkle tree');
  }

  const responseBuf = await response.arrayBuffer();

  const merkleTree = MerkleTreeList.deserializeBinary(
    new Uint8Array(responseBuf)
  );

  return merkleTree;
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
const useEligibleGroups = (addresses: Hex[] | undefined) => {
  const [merkleTrees, setMerkleTrees] = useState<MerkleTreeSelect[] | null>(
    null
  );
  const [eligibleGroups, setEligibleGroups] = useState<EligibleGroup[] | null>(
    null
  );
  const [scoreAfterAddingAll, setScoreAfterAddingAll] = useState<bigint | null>(
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
    if (addresses && addresses.length > 0 && merkleTrees) {
      setEligibleGroups(null);

      // @ts-ignore
      const circuit = await import('circuit-web');
      circuit.init_panic_hook();

      // Mapping of tree IDs to the addresses that matched the bloom filter
      const bloomFilterMatchedTrees = new Map<number, Hex[]>();

      // Fill `bloomFilterMatchedTrees`
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
              // Add the address to the list of matched addresses for the tree
              bloomFilterMatchedTrees.set(
                merkleTree.id,
                (bloomFilterMatchedTrees.get(merkleTree.id) || []).concat(
                  address
                )
              );
            }
          } else {
            console.log('Bloom filter not available');
          }
        }
      }

      // Get the tree IDs that had a match in the bloom filter
      const bloomFilterMatchedTreeIds = Array.from(
        bloomFilterMatchedTrees.keys()
      );

      const _eligibleGroups: EligibleGroup[] = [];

      // Get and check for false positives in batches
      for (
        let i = 0;
        i < bloomFilterMatchedTreeIds.length;
        i += MAX_TREES_PRE_REQUEST
      ) {
        const ids = bloomFilterMatchedTreeIds.slice(
          i,
          i + MAX_TREES_PRE_REQUEST
        );

        const merkleTreeList = await getMerkleTrees(ids);

        const merkleTreesProtoBufs = merkleTreeList.getTreesList();

        for (let j = 0; j < merkleTreesProtoBufs.length; j++) {
          const merkleTreeProtoBuf = merkleTreesProtoBufs[j];
          const treeId = ids[j];

          // Get the addresses that matched the bloom filter for the tree
          const addresses = bloomFilterMatchedTrees.get(treeId) || [];

          // Search for an address that is actually in the tree
          for (const address of addresses) {
            const merkleProof = getMerkleProof(merkleTreeProtoBuf, address);
            if (merkleProof === null) {
              console.log('Bloom filter false positive');
            } else {
              const treeId = ids[j];

              const group = merkleTrees.find(tree => tree.id === treeId)!.Group;

              _eligibleGroups.push({
                ...group,
                address,
                treeId,
                merkleProof,
              });

              // We only need one address to be eligible for the group
              break;
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

  useEffect(() => {
    if (eligibleGroups) {
      let score = BigInt(0);
      for (const group of eligibleGroups) {
        if (group.score) {
          score += BigInt(group.score);
        }
      }
      setScoreAfterAddingAll(score);
    }
  }, [eligibleGroups]);

  return { eligibleGroups, scoreAfterAddingAll };
};

export default useEligibleGroups;
