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
  console.log('warpcast-proxy', params.username);
  return NextResponse.redirect(`https://warpcast.com/${params.username}`);
}
