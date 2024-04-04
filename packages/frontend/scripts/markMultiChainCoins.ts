import 'dotenv/config';
import axios from 'axios';
import prisma from '@/lib/prisma';
import { Hex } from 'viem';
import { ContractType } from '@prisma/client';

export const getCoin = async (chain: string, contractAddress: Hex) => {
  let chainStr;
  switch (chain) {
    case 'Ethereum':
      chainStr = 'ethereum';
      break;
    case 'Arbitrum One':
      chainStr = 'arbitrum-one';
      break;
    case 'Base':
      chainStr = 'base';
      break;
    case 'OP Mainnet':
      chainStr = 'optimism';
      break;
    default:
      throw new Error('Unsupported chain');
  }

  try {
    const response = await axios.get(
      `https://pro-api.coingecko.com/api/v3/coins/${chainStr}/contract/${contractAddress}?x_cg_pro_api_key=${process.env.COINGECKO_API_KEY}`
    );
    return response.data;
  } catch (err) {
    console.error('error', contractAddress);
  }
};

const getCoins = async () => {
  const contracts = await prisma.contract.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      chain: true,
    },
    where: {
      type: ContractType.ERC20,
    },
  });

  const multiChain = [];
  for (const contract of contracts) {
    const coin = await getCoin(contract.chain, contract.address as Hex);
    if (coin) {
      console.log(contract.name, coin.platforms);
      if (Object.keys(coin.platforms).length > 1) {
        multiChain.push(contract.id);
      }
    }
  }

  await prisma.contract.updateMany({
    where: {
      id: {
        in: multiChain,
      },
    },
    data: {
      isMultiChain: true,
    },
  });
};

getCoins();
