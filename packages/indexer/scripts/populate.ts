import 'dotenv/config';
import { Contract } from '@prisma/client';
import prisma from '../src/prisma';

const CONTRACTS: Pick<
  Contract,
  | 'name'
  | 'type'
  | 'address'
  | 'chain'
  | 'symbol'
  | 'deployedBlock'
  | 'targetGroups'
>[] = [
  {
    address: '0xa9d54f37ebb99f83b603cc95fc1a5f3907aaccfd',
    name: 'Pikaboss',
    symbol: 'pika',
    deployedBlock: BigInt(16628745),
    targetGroups: ['earlyHolder', 'whale'],
    chain: 'Ethereum',
    type: 'ERC20',
  },
  {
    address: '0x02e7f808990638e9e67e1f00313037ede2362361',
    name: 'KiboShib',
    symbol: 'KIBSHI',
    deployedBlock: BigInt(16140853),
    targetGroups: ['earlyHolder', 'whale'],
    chain: 'Ethereum',
    type: 'ERC20',
  },
];

const DEV_FIDS: number[] = [54, 12783, 20559];

const { IS_PULL_REQUEST, NODE_ENV } = process.env;

const populate = async () => {
  // Run this script only in PRs (i.e. Render preview environments)
  // and non-production environments
  if (IS_PULL_REQUEST === 'true' || NODE_ENV !== 'production') {
    for (const contract of CONTRACTS) {
      await prisma.contract.upsert({
        update: contract,
        create: contract,
        where: {
          address_chain: {
            address: contract.address,
            chain: contract.chain,
          },
        },
      });
    }

    // Upsert a dummy group
    const devGroupData = {
      handle: `dev0`,
      displayName: `Dev 0`,
    };
    const devGroup = await prisma.group.upsert({
      create: devGroupData,
      update: devGroupData,
      where: {
        handle: devGroupData.handle,
      },
    });

    // Upsert a dummy tree
    const devTreeData = {
      merkleRoot: '0x0',
      groupId: devGroup.id,
      blockNumber: BigInt(0),
    };

    const devTree = await prisma.merkleTree.upsert({
      create: devTreeData,
      update: devTreeData,
      where: {
        merkleRoot_groupId_blockNumber: devTreeData,
      },
    });

    // Create some dummy FID attestations
    await prisma.fidAttestation.createMany({
      data: DEV_FIDS.map(fid => ({
        fid,
        signInSig: Buffer.from('dummy'),
        attestation: Buffer.from('dummy'),
        treeId: devTree.id,
      })),
      skipDuplicates: true,
    });
  }
};

populate();
