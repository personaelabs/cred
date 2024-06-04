import { PrivyClient } from '@privy-io/server-auth';
import { NextRequest } from 'next/server';

const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

if (!PRIVY_APP_SECRET) {
  throw new Error('PRIVY_APP_SECRET is not set');
}

const privy = new PrivyClient('clw1tqoyj02yh110vokuu7yc5', PRIVY_APP_SECRET);

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
