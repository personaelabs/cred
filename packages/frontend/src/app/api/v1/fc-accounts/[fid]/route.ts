export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { withHandler } from '@/lib/utils';
import { NextRequest } from 'next/server';

// This is a workaround for the fact that BigInts are not supported by JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

/**
 * Returns the creddd and score of a user
 */
export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      fid: string;
    };
  }
) {
  return withHandler(async () => {
    const fid = Number(params.fid);

    const user = await prisma.user.findUnique({
      select: {
        fid: true,
        score: true,
        creddd: true,
      },
      where: {
        fid,
      },
    });

    if (!user) {
      return Response.json(
        {
          fid,
          score: 0,
          creddd: [],
        },
        {
          status: 404,
        }
      );
    }

    // Return user data and attestations
    return Response.json(user, {
      status: 200,
    });
  });
}
