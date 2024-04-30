import { filterActive } from '@/lib/neynar';
import { withHandler } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Redirect to the Warpcast profile page
 */
export async function GET(_req: NextRequest, _params: any) {
  return withHandler(async () => {
    // This is the fid that clicked the link
    const fids = [54, 3, 454006];

    const active = await filterActive(fids);

    return NextResponse.json({ active });
  });
}
