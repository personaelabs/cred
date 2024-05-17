/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { getAuth } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { User } from '@cred/shared';
import { initAdminApp } from '@cred/firebase';
import { App, getApps } from 'firebase-admin/app';
import { PrivyClient } from '@privy-io/server-auth';

let app: App;
if (getApps().length === 0) {
  app = initAdminApp();
} else {
  app = getApps()[0];
  console.log('Firebase app already initialized.');
}

const db = getFirestore(app);

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      roomId: string;
    };
  }
) {
  const { roomId } = params;
  // TODO: Wait for transaction confirmation and add user to room

  return Response.json({}, { status: 200 });
}
