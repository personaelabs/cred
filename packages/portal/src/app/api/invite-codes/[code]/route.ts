import {
  isValidInviteCode,
  markInviteCodeAsUsed,
} from '@/lib/backend/inviteCode';
import privy from '@/lib/backend/privy';
import { NextRequest } from 'next/server';

/**
 * Check if an invite code is valid.
 */
export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      code: string;
    };
  }
) {
  const code = params.code;

  const isValid = await isValidInviteCode(code);

  return Response.json({ isValid }, { status: 200 });
}

/**
 * Mark an invite code as used by the authenticated user.
 */
export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      code: string;
    };
  }
) {
  const code = params.code;

  const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!accessToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isVerified = await privy.verifyAuthToken(accessToken);

  if (!isVerified.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isValid = await isValidInviteCode(code);

  if (!isValid) {
    return Response.json({ error: 'Invalid invite code' }, { status: 400 });
  }

  await markInviteCodeAsUsed({
    inviteCode: code,
    userId: isVerified.userId,
  });

  return Response.json({ isValid }, { status: 200 });
}
