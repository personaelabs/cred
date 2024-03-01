import 'dotenv/config';
import { Hex, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as chains from 'viem/chains';
import tokenAbi from './TokenAbi.json';

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

const TOKEN_CONTRACT = '0xcce6fae76656e038abee27a40e9209b7dfae5f74';

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
