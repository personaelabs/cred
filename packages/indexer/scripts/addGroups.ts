import 'dotenv/config';
import { Group } from '@prisma/client';
import prisma from '../src/prisma';
import { Hex } from 'viem';
import { saveTree } from '../src/lib/tree';

type GroupData = Pick<Group, 'displayName' | 'handle' | 'type'> & {
  addresses: Hex[];
};

const groups: GroupData[] = [
  {
    displayName: 'creddd team',
    handle: 'creddd-team',
    type: 'static',
    addresses: [
      '0x4f7d469a5237bd5feae5a3d852eea4b65e06aad1', // pfeffunit.eth
      '0xcb46219ba114245c3a18761e4f7891f9c4bef8c0', // lsankar.eth
      '0x400ea6522867456e988235675b9cb5b1cf5b79c8', // dantehrani.eth
    ],
  },
];

const addGroups = async (groups: GroupData[]) => {
  for (const groupData of groups) {
    console.log(`Adding group ${groupData.displayName} ${groupData.handle}`);

    // Check if the group already exists
    const exitingGroup = await prisma.group.findUnique({
      select: {
        merkleTrees: {
          select: {
            blockNumber: true,
          },
          take: 1,
          orderBy: {
            blockNumber: 'desc',
          },
        },
      },
      where: {
        handle: groupData.handle,
      },
    });

    let blockNumber = BigInt(0);
    // If the group exists, get the latest block number and increment it
    // to use it for the new Merkle tree
    if (exitingGroup?.merkleTrees && exitingGroup.merkleTrees.length > 0) {
      const latestTree = exitingGroup.merkleTrees[0];
      blockNumber = latestTree.blockNumber + BigInt(1);
    }

    // Create object without `addresses` to upsert the group
    const data = {
      displayName: groupData.displayName,
      handle: groupData.handle,
      type: groupData.type,
    };

    // Upsert the group
    const group = await prisma.group.upsert({
      update: data,
      create: data,
      where: {
        handle: groupData.handle,
      },
    });

    // Create a Merkle tree
    await saveTree({
      groupId: group.id,
      addresses: groupData.addresses,
      blockNumber,
    });
  }
};

addGroups(groups);
