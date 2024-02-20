import prisma from './prisma';
import CastProcessor from './lib/CastProcessor';

const main = async () => {
  const neynarDbConfig = {
    host: process.env.NEYNAR_DB_HOST,
    port: process.env.NEYNAR_DB_PORT,
    database: process.env.NEYNAR_DB_NAME,
    user: process.env.NEYNAR_DB_USER,
    password: process.env.NEYNAR_DB_PASSWORD,
  };
  const c = new CastProcessor(neynarDbConfig, prisma);

  const mostRecentProcessed = await prisma.processedCast.findFirst({
    orderBy: {
      processedTime: 'desc',
    },
  });

  const t =
    mostRecentProcessed?.processedTime.toISOString() ??
    new Date(0).toISOString();

  await c.processNewCasts(t);
};

main();
