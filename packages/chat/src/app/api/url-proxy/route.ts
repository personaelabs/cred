import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  console.log('proxy:', url);

  if (!url) {
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
