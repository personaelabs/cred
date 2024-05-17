import { getAuth } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { User } from '@cred/shared';
import { initAdminApp } from '@cred/firebase';
import { App, getApps } from 'firebase-admin/app';
import { PrivyClient } from '@privy-io/server-auth';

const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

if (!PRIVY_APP_SECRET) {
  throw new Error('PRIVY_APP_SECRET is not set');
}

const privy = new PrivyClient('clw1tqoyj02yh110vokuu7yc5', PRIVY_APP_SECRET);

let app: App;
if (getApps().length === 0) {
  app = initAdminApp();
} else {
  app = getApps()[0];
  console.log('Firebase app already initialized.');
}

const db = getFirestore(app);
const auth = getAuth(app);

export async function POST(req: NextRequest) {
  const bearerToken = req.headers.get('Authorization');

  const authToken = bearerToken?.split(' ')[1];

  if (!authToken) {
    throw new Error('No authorization token provided');
  }

  const verifiedClaims = await privy.verifyAuthToken(authToken);

  const user = await privy.getUser(verifiedClaims.userId);

  const token = await auth.createCustomToken(user.id);

  if (!user.farcaster) {
    throw new Error('User has not linked a Farcaster account');
  }

  if (!user.wallet) {
    throw new Error('User has not linked a wallet');
  }

  const userData: User = {
    id: user.id,
    displayName: user.farcaster?.displayName || '',
    username: user.farcaster?.username || '',
    pfpUrl: user.farcaster?.pfp || '',
    privyAddress: user.wallet.address,
    config: {
      notification: {
        mutedRoomIds: [],
      },
    },
  };

  await db.collection('users').doc(user.id).set(userData);

  return Response.json({ token }, { status: 200 });
}
