import { MerkleTreeSelect } from '@/app/api/trees/route';
import {
  PRECOMPUTED_HASHES,
  captureFetchError,
  fromHexString,
  toHexString,
} from '@/lib/utils';
import { Hex, hexToBytes } from 'viem';
import { EligibleGroup, MerkleProof } from '@/app/types';
import { MerkleTree, MerkleTreeList } from '@/proto/merkle_tree_pb';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

const MAX_TREES_PRE_REQUEST = 5;

/**
 * Get the latest Merkle trees of the given group IDs
 * @returns Protocol buffer binary of the Merkle trees
 */
const getMerkleTrees = async (groupIds: string[]): Promise<MerkleTreeList> => {
  const params = new URLSearchParams();
  params.set('groupIds', groupIds.join(','));
  const response = await fetch(`/api/groups?${params.toString()}`);

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

const getEligibleGroups = async (
  addresses: readonly Hex[],
  merkleTrees: MerkleTreeSelect[]
) => {
  // @ts-ignore
  const circuit = await import('circuit-web');
  circuit.init_panic_hook();

  // Mapping of group IDs to the addresses that matched the bloom filter
  const bloomFilterMatchedGroups = new Map<string, Hex[]>();

  // Fill `bloomFilterMatchedGroups`
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
          bloomFilterMatchedGroups.set(
            merkleTree.Group.id,
            (bloomFilterMatchedGroups.get(merkleTree.Group.id) || []).concat(
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
  const bloomFilterMatchedGroupIds = Array.from(
    bloomFilterMatchedGroups.keys()
  );

  const _eligibleGroups: EligibleGroup[] = [];

  // Get and check for false positives in batches
  for (
    let i = 0;
    i < bloomFilterMatchedGroupIds.length;
    i += MAX_TREES_PRE_REQUEST
  ) {
    const ids = bloomFilterMatchedGroupIds.slice(i, i + MAX_TREES_PRE_REQUEST);

    const merkleTreeList = await getMerkleTrees(ids);

    const merkleTreesProtoBufs = merkleTreeList.getTreesList();

    for (let j = 0; j < merkleTreesProtoBufs.length; j++) {
      const merkleTreeProtoBuf = merkleTreesProtoBufs[j];
      const groupId = ids[j];

      // Get the addresses that matched the group bloom filter
      const addresses = bloomFilterMatchedGroups.get(groupId) || [];

      // Check for false positives
      for (const address of addresses) {
        const merkleProof = getMerkleProof(merkleTreeProtoBuf, address);
        if (merkleProof === null) {
          console.log('Bloom filter false positive');
        } else {
          // It's now confirmed that the address is in the tree

          // Get the `Group` object
          const group = merkleTrees.find(
            tree => tree.Group.id === groupId
          )!.Group;

          _eligibleGroups.push({
            ...group,
            address,
            merkleProof,
          });

          // We only need one address to be eligible for the group
          break;
        }
      }
    }
  }
  return _eligibleGroups;
};

/**
 * Get all Merkle trees and their bloom filters
 */
const useMerkleTrees = () =>
  useQuery({
    queryKey: ['merkle-trees'],
    queryFn: async () => {
      const response = await fetch(`/api/trees`);

      if (!response.ok) {
        await captureFetchError(response);
        throw new Error('Failed to fetch merkle trees');
      } else {
        return (await response.json()) as MerkleTreeSelect[];
      }
    },
  });

/**
 *  Get the eligible groups for the connected addresses
 */
const useEligibleGroups = () => {
  const { data: merkleTrees } = useMerkleTrees();
  const { addresses } = useAccount();

  return useQuery({
    queryKey: ['eligible-groups'],
    queryFn: async (): Promise<EligibleGroup[] | null> => {
      if (addresses && merkleTrees) {
        return await getEligibleGroups(addresses, merkleTrees);
      } else {
        return null;
      }
    },
    enabled: !!merkleTrees && !!addresses,
  });
};

export default useEligibleGroups;
