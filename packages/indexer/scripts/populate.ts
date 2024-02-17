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
    address: '0x1151cb3d861920e07a38e03eead12c32178567f6',
    name: 'Bonk',
    symbol: 'BONK',
    deployedBlock: BigInt(16628745),
    targetGroups: ['earlyHolder', 'whale'],
    chain: 'Ethereum',
    type: 'ERC20',
  },
  {
    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    name: 'Uniswap',
    symbol: 'UNI',
    deployedBlock: BigInt(10861674),
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
