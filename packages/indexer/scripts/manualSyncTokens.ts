import 'dotenv/config';

import { ContractType } from '@prisma/client';

import prisma from '../src/prisma';

export type EthContract = {
  address: string;
  name: string;
  symbol: string;
  deployedBlock: number;
};

const _tokens2_18_24: EthContract[] = [
  {
    address: '0xb8a87405d9a4f2f866319b77004e88dff66c0d92',
    deployedBlock: 19235060,
    name: 'Sora',
    symbol: 'sora',
  },
  {
    address: '0xaaeE1A9723aaDB7afA2810263653A34bA2C21C7a',
    deployedBlock: 17731591,
    name: 'Mog Coin',
    symbol: 'mog',
  },
  {
    address: '0x24fcFC492C1393274B6bcd568ac9e225BEc93584',
    deployedBlock: 18709570,
    name: 'Heroes of Mavia',
    symbol: 'mavia',
  },
  {
    address: '0x710287D1D39DCf62094A83EBB3e736e79400068a',
    deployedBlock: 18569660,
    name: 'enqAI',
    symbol: 'enqai',
  },
];

const _tokens2_19_24: EthContract[] = [
  {
    address: '0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3',
    deployedBlock: 14670968,
    name: 'Ondo',
    symbol: 'ondo',
  },
  {
    address: '0x58cB30368ceB2d194740b144EAB4c2da8a917Dcb',
    deployedBlock: 18665578,
    name: 'Zyncoin',
    symbol: 'zyn',
  },
  {
    address: '0xe3DBC4F88EAa632DDF9708732E2832EEaA6688AB',
    deployedBlock: 19215261,
    name: 'Arbius',
    symbol: 'aius',
  },
  {
    address: '0x77e06c9eccf2e797fd462a92b6d7642ef85b0a44',
    deployedBlock: 16521600,
    name: 'Wrapped TAO',
    symbol: 'wTAO',
  },
];

const addTokens = async (tokens: EthContract[]) => {
  for (const token of tokens) {
    const dbToken = {
      address: token.address,
      chain: 'Ethereum',
      deployedBlock: BigInt(token.deployedBlock),
      name: token.name,
      symbol: token.symbol,
      type: ContractType.ERC20,
      targetGroups: ['earlyHolder', 'whale'],
    };

    console.log(`Adding token ${token.symbol} (${token.address})`);

    await prisma.contract.upsert({
      update: dbToken,
      create: dbToken,
      where: {
        address_chain: {
          address: dbToken.address,
          chain: 'Ethereum',
        },
      },
    });
  }
};

addTokens(_tokens2_19_24);
