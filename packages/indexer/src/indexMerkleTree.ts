import { get_merkle_proofs } from '@personaelabs/merkle-tree';
import { Hex } from 'viem';
import prisma from './prisma';
import { MerkleProof } from '@prisma/client';
import { syncERC721 } from './providers/erc721/erc721';
import { syncERC20 } from './providers/erc20/erc20';
import { GroupMeta } from './types';
import spaces from './spaces/spaces';

const toHex = (x: string): Hex => {
  return `0x${BigInt(x).toString(16)}`;
};

const parseMerkleProof = (
  merkleProof: string
): Omit<MerkleProof, 'createdAt' | 'updatedAt' | 'id'> => {
  const merkleProofJSON = JSON.parse(merkleProof);
  const address = toHex(merkleProofJSON['leaf']);
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

const TREE_DEPTH = 15; // We use a depth of 15 for all trees

const saveTree = async (addresses: Hex[], spaceMeta: GroupMeta) => {
  // Skip if there are no addresses
  if (addresses.length === 0) {
    console.log(`Skipping ${spaceMeta.handle} as there are no addresses`);
    return;
  }

  const addressesBytes = new Uint8Array(addresses.length * 20);

  for (const [i, address] of addresses.entries()) {
    addressesBytes.set(Buffer.from(address.slice(2), 'hex'), i * 20);
  }

  const merkleProofs = await get_merkle_proofs(addressesBytes, TREE_DEPTH);
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
        handle: spaceMeta.handle,
      },
      create: spaceMeta,
      update: spaceMeta,
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
  await syncERC721();
  await syncERC20();

  for (const spaceSpc in spaces) {
    const space = spaces[spaceSpc];
    const addresses = await space.resolveMembers();
    console.log(
      `Indexing ${addresses.length} addresses for ${space.space.handle}`
    );
    await saveTree(addresses, space.space);
  }
};

indexMerkleTree();
