import { getAuth } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import {
  FARCASTER_1_ROOM_CREDDD,
  FARCASTER_1_ROOM_ID,
  User,
  userConverter,
} from '@cred/shared';
import logger from '@/lib/backend/logger';
import { User as PrivyUser } from '@privy-io/server-auth';
import { addWriterToRoom, app } from '@cred/firebase-admin';
import privy, { isAuthenticated } from '@/lib/backend/privy';
import * as neynar from '@/lib/backend/neynar';
import { addUserConnectedAddress } from '@/lib/backend/connectedAddress';
import credddRpcClient from '@/lib/credddRpc';
import { SignInResponse } from '@/types';

const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Save the Privy user to Firestore.
 * This will overwrite any existing user data.
 */
const initUser = async (user: PrivyUser) => {
  if (!user.wallet) {
    throw new Error('User has not linked a wallet');
  }

  const userData: User = {
    id: user.id,
    displayName: '',
    username: '', // Leave the username blank until the user explicitly sets it
    pfpUrl: '',
    privyAddress: user.wallet.address.toLowerCase(),
    config: {
      notification: {
        mutedRoomIds: [],
      },
    },
    addedCreddd: [],
    connectedAddresses: [],
    inviteCode: '',
    isMod: false,
  };

  if (user.farcaster) {
    userData.displayName = user.farcaster.displayName || '';
    userData.pfpUrl = user.farcaster.pfp || '';
  } else if (user.google) {
    userData.displayName = user.google.name || '';
  } else if (user.twitter) {
    userData.displayName = user.twitter.name || '';
    userData.pfpUrl = user.twitter.profilePictureUrl || '';
  } else {
    throw new Error('User has no linked account');
  }

  await db.collection('users').doc(user.id).set(userData);
};

/**
 * Get the custody address and verified addresses for an Farcaster user.
 */
const getFarcasterAddresses = async (fid: number) => {
  const fcUser = await neynar.getUser(fid);

  if (fcUser) {
    return [...fcUser.verified_addresses.eth_addresses, fcUser.custody_address];
  } else {
    logger.error(`Failed to get Farcaster user ${fid}`);
    return [];
  }
};

/**
 * If the invite code is valid, does the following:
 * - Creates a new user in Firestore if the user does not exist
 * - Adds the user to the rooms for each connected address
 * - Returns a jwt token
 */
export async function POST(req: NextRequest) {
  const verifiedClaims = await isAuthenticated(req);

  const user = await privy.getUser(verifiedClaims.userId);

  const token = await auth.createCustomToken(user.id);

  if (!user.wallet) {
    throw new Error('User has not linked a wallet');
  }

  const userExists = await db
    .collection('users')
    .withConverter(userConverter)
    .doc(user.id)
    .get();

  if (!userExists.exists) {
    await initUser(user);
  }

  // If the user logged in with Farcaster, pull their connected addresses
  // and save them in Firestore
  if (user.farcaster?.fid) {
    const addresses = await getFarcasterAddresses(user.farcaster.fid);

    if (addresses) {
      await Promise.all(
        addresses.map(async address => {
          await addUserConnectedAddress({
            userId: user.id,
            address,
          });
        })
      );

      // Add the user to the room for each connected address
      await Promise.all(
        addresses.map(async address => {
          // Get the groups the address belongs to
          const groups = await credddRpcClient.getAddressGroups(address);

          // Add the user to the eligible groups
          await Promise.all(
            groups.map(async group => {
              // If the user is eligible for the ETHCC room, add them to the room
              if (FARCASTER_1_ROOM_CREDDD.includes(group.id)) {
                console.log('Adding user to Farcaster room on sign in');
                await addWriterToRoom({
                  roomId: FARCASTER_1_ROOM_ID,
                  userId: user.id,
                });
              }

              await addWriterToRoom({
                roomId: group.id,
                userId: user.id,
              });
            })
          );
        })
      );
    }
  }

  const userData = userExists.data();

  const response: SignInResponse = {
    token,
    user: userData || null,
  };

  return Response.json(response, { status: 200 });
}
