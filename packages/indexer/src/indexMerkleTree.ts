const merkleTree = require('@personaelabs/merkle-tree');
import { Hex } from 'viem';
import prisma from './prisma';
import { MerkleProof } from '@prisma/client';
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

const TREE_DEPTH = 18; // We use a depth of 18 for all trees

/**
 *  Create a new merkle tree and save the merkle proofs for the given addresses
 */
const saveTree = async (addresses: Hex[], groupMeta: GroupMeta) => {
  // Skip if there are no addresses
  if (addresses.length === 0) {
    console.log(`Skipping ${groupMeta.handle} as there are no addresses`);
    return;
  }

  const addressesBytes = new Uint8Array(addresses.length * 32);

  for (const [i, address] of addresses.entries()) {
    const paddedAddress = address.slice(2).padStart(64, '0');
    addressesBytes.set(Buffer.from(paddedAddress, 'hex'), i * 32);
  }

  const merkleProofs = await merkleTree.secp256k1_get_proofs(
    addressesBytes,
    TREE_DEPTH
  );

  const parsedMerkleProofs = merkleProofs.map(parseMerkleProof);
  const merkleRoot = parsedMerkleProofs[0].merkleRoot;

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
        merkleRoot: parsedMerkleProofs[0].merkleRoot,
      },
    });

    // Save the merkle proofs
    await prisma.merkleProof.createMany({
      data: parsedMerkleProofs,
    });
  }
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
