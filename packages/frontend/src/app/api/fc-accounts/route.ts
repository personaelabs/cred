export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { Hex, Chain } from 'viem';
import { hdKeyToAccount, mnemonicToAccount } from 'viem/accounts';

const { RESKIN_MNEMONIC } = process.env;

if (!RESKIN_MNEMONIC) {
  throw new Error('RESKIN_MNEMONIC is not set');
}

const account = mnemonicToAccount(RESKIN_MNEMONIC);
const hdKey = account.getHdKey();

/**
 * Register a new Farcaster account.
 * @returns The Ethereum address to send a payment to.
 */
export async function POST(req: NextRequest) {
  const {
    custodyAddress,
  }: {
    custodyAddress: Hex;
    chain: Chain;
  } = await req.json();

  const account = hdKeyToAccount(hdKey, {
    path: `m/44'/60'/${custodyAddress}'/0/2`,
  });

  //  account.getHdKey().privateKey;

  // Submit transaction to transfer the FID
  // Save the account and the custody address to the database

  await prisma.paymentAddress.create({
    data: {
      address: account.address,
      custodyAddress: custodyAddress,
    },
  });

  return NextResponse.json({ address: account.address });
}
