import prisma from '@/lib/prisma';

/**
 * Returns a list of suggested follows for a given user.
 * Suggested follows are the first `limit` highest score users that the user is not following.
 * @param excludeFids List of FIDs that the user is following.
 * @param limit Maximum number of suggested follows to return.
 */
export async function getSuggestedFollows(
  excludeFids: number[],
  includeFids: number[] | null = null,
  limit = -1
) {
  const baseQuery: any = {
    select: {
      fid: true,
      score: true,
    },
    where: {
      NOT: {
        fid: {
          in: excludeFids,
        },
      },
    },
    orderBy: {
      score: 'desc',
    },
  };

  if (includeFids) {
    baseQuery.where = {
      AND: [
        {
          NOT: {
            fid: {
              in: excludeFids,
            },
          },
        },
        {
          fid: {
            in: includeFids,
          },
        },
      ],
    };
  }
  if (limit !== -1) {
    baseQuery['take'] = limit;
  }

  console.log('query:', baseQuery);

  return await prisma.user.findMany(baseQuery);

  if (limit === -1) {
    return await prisma.user.findMany({
      select: {
        fid: true,
        score: true,
      },
      where: {
        NOT: {
          fid: {
            in: excludeFids,
          },
        },
      },
      orderBy: {
        score: 'desc',
      },
    });
  } else {
    return await prisma.user.findMany({
      select: {
        fid: true,
        score: true,
      },
      where: {
        NOT: {
          fid: {
            in: excludeFids,
          },
        },
      },
      orderBy: {
        score: 'desc',
      },
      take: limit,
    });
  }
}

/**
 * Returns the number of non-zero score users that the given user is following.
 */
export async function getNonZeroFollowCount(
  followingFids: number[]
): Promise<number> {
  const result = await prisma.user.count({
    where: {
      fid: {
        in: followingFids,
      },
      score: {
        gt: 0,
      },
    },
  });

  return result;
}

/**
 * Returns the average non-zero scores of the given FIDs.
 */
export async function getAverageScore(
  fids: number[],
  nonzero: boolean = true
): Promise<number> {
  let query = {};
  if (nonzero) {
    query = {
      _avg: {
        score: true,
      },
      where: {
        fid: {
          in: fids,
        },
        score: {
          gt: 0,
        },
      },
    };
  } else {
    query = {
      _avg: {
        score: true,
      },
      where: {
        fid: {
          in: fids,
        },
      },
    };
  }

  const result = await prisma.user.aggregate(query);

  if (!result._avg) {
    return 0;
  }

  return Math.round(result._avg.score ?? 0);
}

/**
 * Returns the median non-zero scores of the given FIDs.
 */
export async function getNonzeroMedianScore(fids: number[]): Promise<number> {
  const result = await prisma.user.findMany({
    select: {
      score: true,
    },
    where: {
      fid: {
        in: fids,
      },
      score: {
        gt: 0,
      },
    },
  });

  // Get the median

  // The score won't realistically overflow
  result.sort((a, b) => Number(a.score) - Number(b.score));
  const mid = Math.floor(result.length / 2);

  if (result.length % 2 === 0) {
    return (Number(result[mid - 1].score) + Number(result[mid].score)) / 2;
  } else {
    return Number(result[mid].score);
  }
}

/**
 * Returns the score of the user.
 * Returns 0 if the user does not exist.
 */
export async function getUserScore(fid: number): Promise<bigint> {
  const result = await prisma.user.findUnique({
    select: {
      score: true,
    },
    where: {
      fid,
    },
  });

  if (!result) {
    return BigInt(0);
  }

  return result.score;
}

export async function getLeaderboardUsers() {
  return await prisma.user.findMany({
    select: {
      fid: true,
      score: true,
      creddd: true,
    },
    orderBy: {
      score: 'desc',
    },
    take: 15,
  });
}
