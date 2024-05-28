import { faker } from '@faker-js/faker';

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const getRandomElement = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const getRandomElements = <T>(arr: T[], numElements: number): T[] => {
  return arr.sort(() => Math.random() - 0.5).slice(0, numElements);
};

export const sleepForRandom = async ({
  minMs,
  maxMs,
}: {
  minMs: number;
  maxMs: number;
}) => {
  const sleepFor = faker.number.int({ min: minMs, max: maxMs });
  console.log(`Sleeping for ${sleepFor}ms`);
  await sleep(sleepFor);
};
