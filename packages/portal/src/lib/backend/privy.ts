import { PrivyClient } from '@privy-io/server-auth';
import { NextRequest } from 'next/server';

const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const NEXT_PUBLIC_PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
console.log('NEXT_PUBLIC_PRIVY_APP_ID', NEXT_PUBLIC_PRIVY_APP_ID);

if (!PRIVY_APP_SECRET) {
  throw new Error('PRIVY_APP_SECRET is not set');
}

if (!NEXT_PUBLIC_PRIVY_APP_ID) {
  throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is not set');
}

const privy = new PrivyClient(NEXT_PUBLIC_PRIVY_APP_ID, PRIVY_APP_SECRET);

export const isAuthenticated = async (req: NextRequest) => {
  const bearerToken = req.headers.get('Authorization');

  const authToken = bearerToken?.split(' ')[1];

  if (!authToken) {
    throw new Error('No authorization token provided');
  }

  const verifiedClaims = await privy.verifyAuthToken(authToken);

  return verifiedClaims;
};

export default privy;
