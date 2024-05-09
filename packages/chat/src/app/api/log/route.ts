export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log(body.message);
  return Response.json('OK', { status: 200 });
}
