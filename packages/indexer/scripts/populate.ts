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

const { IS_PULL_REQUEST, NODE_ENV } = process.env;

const populate = async () => {
  // Run this script only in PRs (i.e. Render preview environments)
  // and non-production environments
  if (IS_PULL_REQUEST || NODE_ENV !== 'production') {
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
  }
};

populate();
