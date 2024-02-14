import { MerkleProof } from '@prisma/client';
import prisma from '../prisma';
import { Hex } from 'viem';
const merkleTree = require('merkle-tree-rs');

/**
 * Minimum number of members required to create a group
 */
const MIN_NUM_MEMBERS = 100;

const TREE_DEPTH = 18;
const MAX_NUM_LEAVES = 2 ** TREE_DEPTH;

/**
 * Convert a string (base 10) to a hex string
 */
const toHex = (x: string): Hex => {
  return `0x${BigInt(x).toString(16)}`;
};

/**
 * Convert a string (base 10) to an address
 */
const toAddress = (x: string): Hex => {
  return `0x${BigInt(x).toString(16).padStart(40, '0')}`;
};

/**
 * Parse a merkle proof in JSON format
 * @param merkleProof merkle proof in JSON format
 */
const parseMerkleProof = (
  merkleProof: string
): Omit<MerkleProof, 'createdAt' | 'updatedAt' | 'id'> => {
  const merkleProofJSON = JSON.parse(merkleProof);
  const address = toAddress(toHex(merkleProofJSON['leaf']));

  const merkleRoot = toHex(merkleProofJSON['root']);
  const path = merkleProofJSON['siblings'].map((sibling: string[]) =>
    toHex(sibling[0])
  );
  const pathIndices = merkleProofJSON['pathIndices'].map((x: string) =>
    parseInt(x)
  );

  return {
    address,
    merkleRoot,
    path,
    pathIndices,
  };
};

export const saveTree = async ({
  groupId,
  addresses,
}: {
  groupId: number;
  addresses: Hex[];
}) => {
  if (addresses.length < MIN_NUM_MEMBERS) {
    console.log(
      `Skipping ${groupId} as there are not enough addresses ${MIN_NUM_MEMBERS} > ${addresses.length}`
    );
    return;
  }

  if (addresses.length > MAX_NUM_LEAVES) {
    console.error(
      `Skipping ${groupId} as there are more than ${MAX_NUM_LEAVES} addresses`
    );
    return;
  }

  const addressesBytes = new Uint8Array(addresses.length * 32);

  for (const [i, address] of addresses.entries()) {
    const paddedAddress = address.slice(2).padStart(64, '0');
    addressesBytes.set(Buffer.from(paddedAddress, 'hex'), i * 32);
  }

  // Create new Merkle tree
  console.time(`init_tree ${groupId}`);
  const tree = merkleTree.init_tree(addressesBytes, TREE_DEPTH);
  console.timeEnd(`init_tree ${groupId}`);

  const rootString = merkleTree.get_root(Buffer.from(tree));

  // Convert the root bytes to a hex string
  const merkleRoot = toHex(rootString);

  const merkleRootExists = await prisma.merkleTree.findFirst({
    where: {
      merkleRoot,
    },
  });

  // Save the merkle tree if it doesn't exist yet
  if (!merkleRootExists) {
    // Create a new merkle tree
    await prisma.merkleTree.create({
      data: {
        groupId,
        merkleRoot,
      },
    });

    // Get and save merkle proofs in chunks
    const chunkSize = 10000;
    for (let i = 0; i < addresses.length; i += chunkSize) {
      const chunk = addresses.slice(i, i + chunkSize);

      const chunkBytes = new Uint8Array(chunk.length * 32);

      for (const [i, address] of chunk.entries()) {
        const paddedAddress = address.slice(2).padStart(64, '0');
        chunkBytes.set(Buffer.from(paddedAddress, 'hex'), i * 32);
      }
      // Get the merkle proofs
      console.log('Creating proofs');
      console.time(`create_proof ${groupId} ${i}`);
      const merkleProofs = merkleTree.create_proofs(
        Buffer.from(chunkBytes),
        Buffer.from(tree)
      );
      console.timeEnd(`create_proof ${groupId} ${i}`);

      const parsedMerkleProofs = merkleProofs.map(parseMerkleProof);

      // Save the merkle proofs
      await prisma.merkleProof.createMany({
        data: parsedMerkleProofs,
      });
    }

    // Get the old merkle trees of the group
    const oldTrees = await prisma.merkleTree.findMany({
      where: {
        groupId,
        NOT: {
          merkleRoot,
        },
      },
    });

    // Delete the old merkle proofs
    await prisma.merkleProof.deleteMany({
      where: {
        merkleRoot: {
          in: oldTrees.map(tree => tree.merkleRoot),
        },
      },
    });
  }
};
