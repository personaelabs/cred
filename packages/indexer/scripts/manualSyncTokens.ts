import 'dotenv/config';
import { ContractType, Contract } from '@prisma/client';
import prisma from '../src/prisma';

const tokens = [
  {
    address: '0xb8a87405d9a4f2f866319b77004e88dff66c0d92',
    deployedBlock: BigInt(19235060),
    name: 'Sora',
    symbol: 'sora',
    chain: 'Ethereum',
  },
  {
    address: '0xaaeE1A9723aaDB7afA2810263653A34bA2C21C7a',
    deployedBlock: BigInt(17731591),
    name: 'Mog Coin',
    symbol: 'mog',
    chain: 'Ethereum',
  },
  {
    address: '0x24fcFC492C1393274B6bcd568ac9e225BEc93584',
    deployedBlock: BigInt(18709570),
    name: 'Heroes of Mavia',
    symbol: 'mavia',
    chain: 'Ethereum',
  },
  {
    address: '0x710287D1D39DCf62094A83EBB3e736e79400068a',
    deployedBlock: BigInt(18569660),
    name: 'enqAI',
    symbol: 'enqai',
    chain: 'Ethereum',
  },

  {
    address: '0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3',
    deployedBlock: BigInt(14670968),
    name: 'Ondo',
    symbol: 'ondo',
    chain: 'Ethereum',
  },
  {
    address: '0x58cB30368ceB2d194740b144EAB4c2da8a917Dcb',
    deployedBlock: BigInt(18665578),
    name: 'Zyncoin',
    symbol: 'zyn',
    chain: 'Ethereum',
  },
  {
    address: '0xe3DBC4F88EAa632DDF9708732E2832EEaA6688AB',
    deployedBlock: BigInt(19215261),
    name: 'Arbius',
    symbol: 'aius',
    chain: 'Ethereum',
  },
  {
    address: '0x77e06c9eccf2e797fd462a92b6d7642ef85b0a44',
    deployedBlock: BigInt(16521600),
    name: 'Wrapped TAO',
    symbol: 'wTAO',
    chain: 'Ethereum',
  },
  {
    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    deployedBlock: BigInt(10861674),
    name: 'Uniswap',
    symbol: 'uni',
    chain: 'Ethereum',
  },
  {
    address: '0x5a98fcbea516cf06857215779fd812ca3bef1b32',
    symbol: 'ldo',
    name: 'Lido',
    deployedBlock: BigInt(11473216),
    chain: 'Ethereum',
  },
  {
    address: '0x470c8950C0c3aA4B09654bC73b004615119A44b5',
    symbol: 'kizuna',
    name: 'Kizuna',
    deployedBlock: BigInt(18265095),
    chain: 'Ethereum',
  },
];

const addTokens = async (
  tokens: Pick<
    Contract,
    'address' | 'deployedBlock' | 'name' | 'symbol' | 'chain'
  >[]
) => {
  for (const token of tokens) {
    const data = {
      ...token,
      // Save contract address in lower case
      address: token.address.toLowerCase(),
      type: ContractType.ERC20,
      targetGroups: ['earlyHolder', 'whale'],
    };

    console.log(`Adding token ${token.symbol} (${token.address})`);

    await prisma.contract.upsert({
      update: data,
      create: data,
      where: {
        address_chain: {
          address: data.address,
          chain: 'Ethereum',
        },
      },
    });
  }
};

addTokens(tokens);
