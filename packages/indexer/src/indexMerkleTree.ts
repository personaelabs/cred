const merkleTree = require('@personaelabs/merkle-tree');
import { Hex } from 'viem';
import prisma from './prisma';
import { Group, MerkleProof } from '@prisma/client';
import { syncERC721 } from './providers/erc721/erc721';
import { syncERC20 } from './providers/erc20/erc20';
import { GroupMeta } from './types';
import groupsResolver from './groups/groupsResolver';
import { syncMemeTokensMeta } from './providers/coingecko/coingecko';

const toHex = (x: string): Hex => {
  return `0x${BigInt(x).toString(16)}`;
};

const toAddress = (x: string): Hex => {
  return `0x${BigInt(x).toString(16).padStart(40, '0')}`;
};

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

const TREE_DEPTH = 16;
const MAX_NUM_LEAVES = 2 ** TREE_DEPTH;

/**
 *  Create a new merkle tree and save the merkle proofs for the given addresses.
 *  Delete the Merkle proofs of the old tree if it exists to clear up space.
 */
const saveTree = async (addresses: Hex[], groupMeta: GroupMeta) => {
  // Skip if there are no addresses
  if (addresses.length === 0) {
    console.log(`Skipping ${groupMeta.handle} as there are no addresses`);
    return;
  }

  if (addresses.length > MAX_NUM_LEAVES) {
    console.error(
      `Skipping ${groupMeta.handle} as there are more than ${MAX_NUM_LEAVES} addresses`
    );
    return;
  }

  const addressesBytes = new Uint8Array(addresses.length * 32);

  for (const [i, address] of addresses.entries()) {
    const paddedAddress = address.slice(2).padStart(64, '0');
    addressesBytes.set(Buffer.from(paddedAddress, 'hex'), i * 32);
  }

  // Build the merkle tree
  const rootString = await merkleTree.secp256k1_init_tree(
    addressesBytes,
    TREE_DEPTH
  );

  // Convert the root bytes to a hex string
  const merkleRoot = toHex(rootString);

  const merkleRootExists = await prisma.merkleTree.findFirst({
    where: {
      merkleRoot,
    },
  });

  // Save the merkle tree if it doesn't exist yet
  if (!merkleRootExists) {
    // Create the space if it doesn't exist yet
    const group = await prisma.group.upsert({
      where: {
        handle: groupMeta.handle,
      },
      create: groupMeta,
      update: groupMeta,
    });

    // Create a new merkle tree
    await prisma.merkleTree.create({
      data: {
        groupId: group.id,
        merkleRoot,
      },
    });

    // Get and save merkle proofs in chunks
    const chunkSize = 1000;
    for (let i = 0; i < addresses.length; i += chunkSize) {
      const chunk = addresses.slice(i, i + chunkSize);

      // Get the merkle proofs
      const merkleProofs = chunk.map(address => {
        const paddedAddress = address.slice(2).padStart(64, '0');
        const proof = merkleTree.secp256k1_create_proof(
          Buffer.from(paddedAddress, 'hex')
        );
        return proof as string;
      });

      const parsedMerkleProofs = merkleProofs.map(parseMerkleProof);

      // Save the merkle proofs
      await prisma.merkleProof.createMany({
        data: parsedMerkleProofs,
      });
    }
  }

  // Get the group.
  // At this point, the group should exist as we created it if it didn't exist yet
  const group = (await prisma.group.findFirst({
    where: {
      handle: groupMeta.handle,
    },
  })) as Group;

  // Get the old merkle trees of the group
  const oldTrees = await prisma.merkleTree.findMany({
    where: {
      groupId: group.id,
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
};

const indexMerkleTree = async () => {
  merkleTree.init_panic_hook();

  await syncMemeTokensMeta();
  await syncERC20();

  const groups = await groupsResolver();

  for (const group of groups) {
    const addresses = await group.resolveMembers();
    console.log(
      `Indexing ${addresses.length} addresses for ${group.group.handle}`
    );
    await saveTree(addresses, group.group);
  }
};

indexMerkleTree();
