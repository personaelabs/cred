import 'dotenv/config';
import { Hex, createWalletClient, encodeFunctionData, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as chains from 'viem/chains';
import axios from 'axios';
import tokenAbi from './TokenAbi.json';
import merkleMinterAbi from './MerkleMinterAbi.json';

if (!process.env.PRIV_KEY) {
  throw new Error('Missing PRIV_KEY');
}

const account = privateKeyToAccount(process.env.PRIV_KEY as Hex);

// Initialize the Zora wallet client
const walletClient = createWalletClient({
  chain: chains.zora,
  transport: http(),
  account,
});

// Initialize the Zora allowlist API
const allowListApi = axios.create({
  baseURL: 'https://allowlist.zora.co',
  headers: {
    'Content-Type': 'application/json',
  },
});

const TOKEN_CONTRACT = '0xcce6fae76656e038abee27a40e9209b7dfae5f74';
const MERKLE_MINTER_STRATEGY_CONTRACT =
  '0xf48172CA3B6068B20eE4917Eb27b5472f1f272C7';

/**
 * Update the allowlist merkle root on Zora
 */
const updateMerkleRoot = async (addresses: Hex[]): Promise<Hex> => {
  const body = {
    contract: TOKEN_CONTRACT,
    entries: addresses.map(address => ({
      maxCanMint: 1,
      price: '0',
      user: address,
    })),
  };

  const result = await allowListApi.post('/allowlist', body);

  if (!result.data?.root) {
    throw new Error('No root');
  }

  return `0x${result.data.root}`;
};

/**
 * Update the mint allowlist on Zora
 */
export const updateAllowList = async (addresses: Hex[]) => {
  const merkleRoot = await updateMerkleRoot(addresses);

  const setSale = encodeFunctionData({
    abi: merkleMinterAbi,
    functionName: 'setSale',
    args: [
      1,
      {
        presaleStart: 1709184873,
        presaleEnd: 1711776873,
        fundsRecipient: '0x0000000000000000000000000000000000000000',
        merkleRoot,
      },
    ],
  });

  const callSale = encodeFunctionData({
    abi: tokenAbi,
    functionName: 'callSale',
    args: [1, MERKLE_MINTER_STRATEGY_CONTRACT, setSale],
  });

  const result = await walletClient.writeContract({
    abi: tokenAbi,
    address: TOKEN_CONTRACT,
    functionName: 'multicall',
    args: [[callSale]],
  });

  console.log(`Transaction sent: ${result}`);
};

export const adminMint = async (address: Hex) => {
  console.log('Minting to', address);

  // Only mint in production
  if (process.env.VERCEL_ENV === 'production') {
    const result = await walletClient.writeContract({
      abi: tokenAbi,
      address: TOKEN_CONTRACT,
      functionName: 'adminMint',
      args: [address, 1, 1, '0x'],
    });
    console.log(`Transaction sent: ${result}`);
  }
};
