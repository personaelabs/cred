import { getAuth } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { User } from '@cred/shared';
import { app } from '@cred/firebase';
import privy, { isAuthenticated } from '@/lib/backend/privy';

const db = getFirestore(app);
const auth = getAuth(app);

export async function POST(req: NextRequest) {
  const verifiedClaims = await isAuthenticated(req);

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
    privyAddress: user.wallet.address.toLowerCase(),
    config: {
      notification: {
        mutedRoomIds: [],
      },
    },
  };

  await db.collection('users').doc(user.id).set(userData);

  return Response.json({ token }, { status: 200 });
}
