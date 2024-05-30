import { logger } from '@cred/shared';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    logger.error('Missing URL parameter');
    return new Response('Missing URL parameter', {
      status: 400,
    });
  }

  const response = await fetch(url);

  const data = await response.text();

  return new Response(data, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
