import { isValidInviteCode } from '@/lib/backend/inviteCode';
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
