import { useQuery } from '@tanstack/react-query';
import useSignedInUser from './useSignedInUser';
import { Hex, hexToBytes, toHex } from 'viem';
import { EligibleCreddd, MerkleProof, MerkleTree } from '@/types';
import { getAllMerkleTrees, getGroupLatestMerkleTree } from '@/lib/credddApi';
import { MerkleTree as MerkleTreeProto } from '@/proto/merkle_tree_pb';
import { PRECOMPUTED_HASHES } from '@/lib/poseidon';
import { fromHexString } from '@/lib/utils';

/**
 * Get the Merkle pro of for an address. Returns null if the address is not in the tree.
 */
const getMerkleProof = (
  merkleTree: MerkleTreeProto,
  address: Hex
): MerkleProof | null => {
  const layers = merkleTree.getLayersList();
  const treeDepth = layers.length;

  // Get the leaves of the tree
  const leaves = layers[0].getNodesList();

  // Convert the address to a buffer
  const addressBuffer = Buffer.from(fromHexString(address, 20));

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
    path: siblings.map(sibling => toHex(sibling)),
    pathIndices,
  };
};

const getEligibleCreddd = async ({
  address,
  merkleTrees,
}: {
  address: Hex;
  merkleTrees: MerkleTree[];
}) => {
  const circuitWeb = await import('circuit-web');
  circuitWeb.init_panic_hook();

  // Set of group IDs that matched the bloom filter
  const bloomFilterMatchedGroups = new Set<string>();

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
      const isMember = circuitWeb.bloom_check(
        // @ts-ignore
        merkleTree.bloomFilter.data,
        BigInt(merkleTree.bloomNumBits),
        merkleTree.bloomNumHashes,
        sipKeys,
        addressBytes
      );

      if (isMember) {
        // Add the address to the list of matched addresses for the tree
        bloomFilterMatchedGroups.add(merkleTree.Group.id);
      }
    } else {
      console.log('Bloom filter not available');
    }
  }

  const eligibleGroups: EligibleCreddd[] = [];

  for (const groupId of Array.from(bloomFilterMatchedGroups)) {
    const groupLatestMerkleTree = await getGroupLatestMerkleTree(groupId);
    // Check for false positives
    const merkleProof = getMerkleProof(groupLatestMerkleTree, address);

    if (merkleProof === null) {
      console.log('Bloom filter false positive');
    } else {
      // It's now confirmed that the address is in the tree

      // Get the `Group` object
      const group = merkleTrees.find(tree => tree.Group.id === groupId)!.Group;

      eligibleGroups.push({
        ...group,
        address,
        merkleProof,
      });
    }
  }

  return eligibleGroups;
};

const useAllMerkleTrees = () => {
  return useQuery({
    queryKey: ['merkle-trees'],
    queryFn: async () => {
      return getAllMerkleTrees();
    },
  });
};

const useEligibleCreddd = (address: Hex | null) => {
  const { data: signedInUser } = useSignedInUser();
  const { data: merkleTrees } = useAllMerkleTrees();

  return useQuery({
    queryKey: ['eligible-creddd', { address }],
    queryFn: async () => {
      const eligibleCreddd = await getEligibleCreddd({
        address: address!,
        merkleTrees: merkleTrees!,
      });

      return eligibleCreddd;
    },
    enabled: !!signedInUser && !!address && !!merkleTrees,
  });
};

export default useEligibleCreddd;
