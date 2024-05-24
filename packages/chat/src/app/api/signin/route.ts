import { getAuth } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { User } from '@cred/shared';
import { app } from '@cred/firebase';
import privy, { isAuthenticated } from '@/lib/backend/privy';
import * as neynar from '@/lib/backend/neynar';
import { addUserConnectedAddress } from '@/lib/backend/connectedAddress';

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

  const userExists = await db.collection('users').doc(user.id).get();

  if (!userExists.exists) {
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
      connectedAddresses: [],
    };

    await db.collection('users').doc(user.id).set(userData);
  }

  if (user.farcaster?.fid) {
    const fcUser = await neynar.getUser(user.farcaster.fid);

    if (fcUser) {
      // Add the custody address and all verified addresses to the user's connected addresses
      await Promise.all(
        [
          ...fcUser.verified_addresses.eth_addresses,
          fcUser.custody_address,
        ].map(address =>
          addUserConnectedAddress({
            userId: user.id,
            address,
          })
        )
      );
    } else {
      // TODO: Report error to Sentry
    }
  }

  return Response.json({ token }, { status: 200 });
}
