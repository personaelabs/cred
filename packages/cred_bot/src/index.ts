import prisma from './prisma';
import CastProcessor from './lib/CastProcessor';

const main = async () => {
  const c = new CastProcessor(prisma);
  await c.processNewCasts();
};

main();
