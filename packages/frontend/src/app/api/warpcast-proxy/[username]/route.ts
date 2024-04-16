import { logger, withHandler } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Redirect to the Warpcast profile page
 */
export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      username: string;
    };
  }
) {
  return withHandler(async () => {
    logger.info({ username: params.username }, 'warpcast-proxy');
    return NextResponse.redirect(`https://warpcast.com/${params.username}`);
  });
}
