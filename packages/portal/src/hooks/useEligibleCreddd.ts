import { useQuery } from '@tanstack/react-query';
import useSignedInUser from './useSignedInUser';
import { Hex, hexToBytes, toHex } from 'viem';
import { EligibleCreddd, MerkleProof } from '@/types';
import { MerkleTree as MerkleTreeProto } from '@/proto/merkle_tree_pb';
import { PRECOMPUTED_HASHES } from '@/lib/poseidon';
import { fromHexString } from '@/lib/utils';
import credddKeys from '@/queryKeys/credddKeys';
import useAllRooms from './useAllRooms';
import rpcClient from '@/lib/credddRpc';
import { GetLatestMerkleTreesReturnType } from '@cred/shared';

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
  merkleTrees: GetLatestMerkleTreesReturnType;
}) => {
  const circuitWeb = await import('circuit-web');
  circuitWeb.init_panic_hook();

  // Set of group IDs that matched the bloom filter
  const bloomFilterMatchedGroups = new Set<string>();

  for (const merkleTree of merkleTrees) {
    const sipKeys = Buffer.concat([
      Buffer.from(merkleTree.bloom_sip_keys[0]),
      Buffer.from(merkleTree.bloom_sip_keys[1]),
    ]);

    const addressBytes = hexToBytes(address);

    // Check if the address is a member using the bloom filter
    const isMember = circuitWeb.bloom_check(
      merkleTree.bloom_filter,
      BigInt(merkleTree.bloom_num_bits),
      merkleTree.bloom_num_hashes,
      sipKeys,
      addressBytes
    );

    if (isMember) {
      // Add the address to the list of matched addresses for the tree
      bloomFilterMatchedGroups.add(merkleTree.group.id);
    }
  }

  const eligibleGroups: EligibleCreddd[] = [];

  for (const groupId of Array.from(bloomFilterMatchedGroups)) {
    const result = await rpcClient.getGroupLatestMerkleTree(groupId);
    console.log({ result });

    const groupLatestMerkleTree = MerkleTreeProto.deserializeBinary(
      new Uint8Array(result)
    );

    // Check for false positives
    const merkleProof = getMerkleProof(groupLatestMerkleTree, address);

    if (merkleProof === null) {
      console.info('Bloom filter false positive');
    } else {
      // It's now confirmed that the address is in the tree

      // Get the `Group` object
      const group = merkleTrees.find(tree => tree.group.id === groupId)!.group;

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
    queryKey: credddKeys.merkleTrees,
    queryFn: async () => {
      return rpcClient.getLatestMerkleTrees();
    },
  });
};

const useEligibleCreddd = (address: Hex | null) => {
  const { data: signedInUser } = useSignedInUser();
  const { data: merkleTrees } = useAllMerkleTrees();
  const { data: allRooms } = useAllRooms();

  return useQuery({
    queryKey: credddKeys.eligibleCreddd(address),
    queryFn: async () => {
      const eligibleCreddd = await getEligibleCreddd({
        address: address!,
        merkleTrees: merkleTrees!,
      });

      // Filter out the groups which rooms are not available
      const availableRoomIds = allRooms.map(room => room.id);
      console.log({ availableRoomIds });
      return eligibleCreddd.filter(creddd =>
        availableRoomIds.includes(creddd.id)
      );
    },
    enabled: !!signedInUser && !!address && !!merkleTrees && !!allRooms,
  });
};

export default useEligibleCreddd;
