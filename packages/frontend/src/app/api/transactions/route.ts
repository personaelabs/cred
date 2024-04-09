export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { Hex, Chain } from 'viem';
import { getClient } from '@/lib/ethClient';

/**
 * Start polling the payment transaction
 */
export async function POST(req: NextRequest) {
  const {
    txHash,
    custodyAddress,
    chain,
  }: {
    txHash: Hex;
    custodyAddress: Hex;
    chain: Chain;
  } = await req.json();

  // Start watching
  const client = getClient(chain);

  // Get the transaction
  const tx = await client.waitForTransactionReceipt({
    hash: txHash,
  });

  if (!tx) {
    return NextResponse.json(
      { message: 'Transaction failed' },
      {
        status: 400,
      }
    );
  }

  const txTo = tx.to;

  if (!txTo) {
    return NextResponse.json(
      { message: 'Transaction `to` field is null' },
      {
        status: 400,
      }
    );
  }

  const paymentAddress = await prisma.paymentAddress.findFirst({
    where: {
      custodyAddress,
      address: txTo,
    },
  });

  if (!paymentAddress) {
    return NextResponse.json(
      { message: 'Payment address not found' },
      {
        status: 400,
      }
    );
  }

  /*
  const tx = await client.getTransaction({
    hash: txHash,
  });
  */

  // Check the value of the transaction

  // Transfer an FID to the custody address

  return NextResponse.json({ success: true });
}
