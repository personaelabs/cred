import prisma from './prisma';
import CastProcessor from './lib/CastProcessor';

// Returns `true` if an hour has passed since `startTime`
const oneHourPassed = (startTime: Date): boolean => {
  const currentTime = new Date();
  const elapsedTimeInMilliseconds = currentTime.getTime() - startTime.getTime();
  return elapsedTimeInMilliseconds >= 60 * 60 * 1000;
};

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

  let t =
    mostRecentProcessed?.processedTime.toISOString() ??
    new Date(0).toISOString();

  await c.connectSourceClient();

  const startTime = new Date();

  // Loop `processNewCasts` for an hour
  while (!oneHourPassed(startTime)) {
    console.time('processNewCasts');
    const updatedT = await c.processNewCasts(t);
    if (updatedT) {
      t = updatedT;
    }
    console.timeEnd('processNewCasts');
  }

  await c.disconnectSourceClient();
};

main();
