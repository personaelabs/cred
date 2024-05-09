import {
  createClient,
  verifySignInMessage,
  viemConnector,
} from '@farcaster/auth-client';
import { getAuth } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';
import firebaseAdmin from '@/lib/firebaseAdmin';

// Initialize the SIWF client
const client = createClient({
  relay: 'https://relay.farcaster.xyz',
  ethereum: viemConnector({
    rpcUrl: 'https://mainnet.optimism.io',
  }),
});

const auth = getAuth(firebaseAdmin);

export async function POST(req: NextRequest) {
  const body = await req.json();

  // 1. Verify `signInSig`
  const { success, fid } = await verifySignInMessage(client, {
    nonce: body.nonce,
    message: body.message as string,
    domain: 'creddd.xyz',
    signature: body.signature as `0x${string}`,
  });

  if (!success) {
    console.log('Invalid signature');
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const uid = fid.toString();
  const token = await auth.createCustomToken(uid);

  return Response.json({ token }, { status: 200 });
}
