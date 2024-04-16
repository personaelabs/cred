import { logger, withHandler } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Redirect to the Warpcast profile page
 */
export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      username: string;
    };
  }
) {
  return withHandler(async () => {
    // This is the fid that clicked the link
    const fid = req.nextUrl.searchParams.get('fid');

    logger.info('warpcast-proxy', { username: params.username, fid });
    return NextResponse.redirect(`https://warpcast.com/${params.username}`);
  });
}
