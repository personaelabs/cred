import { Hex } from 'viem';
import prisma from './prisma';
import { GroupContractSpec, MerkleProof } from '@prisma/client';
import { syncERC20 } from './providers/erc20/erc20';
import devResolver from './groups/resolvers/devResolver';
import { syncMemeTokensMeta } from './providers/coingecko/coingecko';
import getEarlyHolders from './groups/resolvers/earlyHoldersResolver';
import getTopHoldersAcrossTime from './groups/resolvers/whaleResolver';
const merkleTree = require('merkle-tree');

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

/**
 *  Create a new merkle tree and save the merkle proofs for the given addresses.
 *  Delete the Merkle proofs of the old tree if it exists to clear up space.
 */
const saveTree = async (addresses: Hex[], groupId: number) => {
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

  // Build the merkle tree
  console.time('init_tree');
  const rootString = await merkleTree.init_tree(addressesBytes, TREE_DEPTH);
  console.timeEnd('init_tree');

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
    const chunkSize = 1000;
    for (let i = 0; i < addresses.length; i += chunkSize) {
      const chunk = addresses.slice(i, i + chunkSize);

      // Get the merkle proofs
      const merkleProofs = chunk.map(address => {
        const paddedAddress = address.slice(2).padStart(64, '0');
        const proof = merkleTree.create_proof(
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

// Get addresses from a contract as specified in `GroupContractSpec`
const resolverMembersWithSpec = async (
  groupSpec: Pick<GroupContractSpec, 'contractId' | 'rules' | 'groupId'>
) => {
  const addresses: Hex[] = [];
  for (const rule of groupSpec.rules) {
    if (rule === 'earlyHolder') {
      const result = await getEarlyHolders(groupSpec.contractId);
      addresses.push(...result);
    } else if (rule === 'whale') {
      const addresses = await getTopHoldersAcrossTime({
        contractId: groupSpec.contractId,
        groupId: groupSpec.groupId,
      });
      addresses.push(...addresses);
    } else {
      throw new Error(`Unknown rule ${rule}`);
    }
  }

  return addresses;
};

const indexMerkleTree = async () => {
  //  if (process.env.NODE_ENV === 'production') {
  if (true) {
    await syncMemeTokensMeta();
    await syncERC20();

    // Get all groups and their contract specs
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        displayName: true,
        groupContractSpecs: {
          select: {
            groupId: true,
            contractId: true,
            rules: true,
          },
        },
      },
    });

    // Index the merkle trees for each group according to their specs
    for (const group of groups) {
      const addresses: Hex[] = [];
      for (const spec of group.groupContractSpecs) {
        const result = await resolverMembersWithSpec(spec);
        addresses.push(...result);
      }

      console.log(
        `Indexing ${addresses.length} addresses for ${group.displayName}`
      );

      // Save the merkle tree to the database
      await saveTree(addresses, group.id);
    }
  } else {
    // In development, only index the dev group

    const devGroupData = {
      handle: 'dev',
      displayName: 'Dev',
    };
    const devGroup = await prisma.group.upsert({
      create: devGroupData,
      update: devGroupData,
      where: {
        handle: devGroupData.handle,
      },
    });

    const addresses = await devResolver();
    console.log(
      `Indexing ${addresses.length} addresses for ${devGroup.displayName}`
    );

    await saveTree(addresses, devGroup.id);
  }
};

indexMerkleTree();
