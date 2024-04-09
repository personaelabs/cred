export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { Hex, toBytes, Chain } from 'viem';
import { HDKey, hdKeyToAccount } from 'viem/accounts';

const MASTER_SEED = Buffer.from(process.env.RESKIN_MNEMONIC as string);
const hdKey = HDKey.fromMasterSeed(MASTER_SEED);

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

  const secret = new Uint8Array(32);
  crypto.getRandomValues(secret);

  const custodyAddressBuf = toBytes(custodyAddress, {
    size: 20,
  });

  const hash = Buffer.from(
    await crypto.subtle.digest(
      'SHA-256',
      Buffer.concat([secret, custodyAddressBuf])
    )
  ).toString('hex');

  const account = hdKeyToAccount(hdKey, {
    path: `m/44'/60'/${hash}'/0/2`,
  });

  //  account.getHdKey().privateKey;

  // Submit transaction to transfer the FID
  // Save the account and the custody address to the database

  // Make sure we can send transfers to Umbra

  await prisma.paymentAddress.create({
    data: {
      encryptedSecret: Buffer.from(secret),
      address: account.address,
      custodyAddress: custodyAddress,
    },
  });

  return NextResponse.json({ address: account.address });
}
