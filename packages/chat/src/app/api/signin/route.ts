import {
  createClient,
  verifySignInMessage,
  viemConnector,
} from '@farcaster/auth-client';
import { getAuth } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { User } from '@cred/shared';
import { initAdminApp } from '@cred/firebase';
import { App, getApps } from 'firebase-admin/app';

let app: App;
if (getApps().length === 0) {
  app = initAdminApp();
} else {
  app = getApps()[0];
  console.log('Firebase app already initialized.');
}

const db = getFirestore(app);
const auth = getAuth(app);

// Initialize the SIWF client
const client = createClient({
  relay: 'https://relay.farcaster.xyz',
  ethereum: viemConnector({
    rpcUrl: 'https://mainnet.optimism.io',
  }),
});

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

  const userData: User = {
    id: uid,
    displayName: body.displayName,
    username: body.username,
    pfpUrl: body.pfpUrl,
    config: {
      notification: {
        mutedRoomIds: [],
      },
    },
  };

  await db.collection('users').doc(uid).set(userData);

  return Response.json({ token }, { status: 200 });
}
