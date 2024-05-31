import { NextRequest } from 'next/server';
import { SetUsernameRequestBody } from '@/types';
import { setUsername, usernameExists } from '@/lib/backend/username';

/**
 * Set the username for a user.
 */
export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      userId: string;
    };
  }
) {
  const body = (await req.json()) as SetUsernameRequestBody;
  const username = body.username;

  // Check that the username is not already taken
  if (await usernameExists(username)) {
    return Response.json(
      {
        error: 'Username already exists',
      },
      { status: 400 }
    );
  }

  await setUsername({
    userId: params.userId,
    username,
  });

  return Response.json({}, { status: 200 });
}
