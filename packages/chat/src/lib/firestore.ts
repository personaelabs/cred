import app from './firebase';
import { CACHE_SIZE_UNLIMITED, initializeFirestore } from 'firebase/firestore';

const VERCEL_GIT_COMMIT_REF = process.env.VERCEL_GIT_COMMIT_REF;

const NEXT_PUBLIC_DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;

const DATABASE_ID = VERCEL_GIT_COMMIT_REF
  ? VERCEL_GIT_COMMIT_REF.replaceAll('/', '-')
  : NEXT_PUBLIC_DATABASE_ID
    ? NEXT_PUBLIC_DATABASE_ID
    : undefined;

console.log('VERCEL_GIT_COMMIT_REF', VERCEL_GIT_COMMIT_REF);
console.log('DATABASE_ID', DATABASE_ID);

const db = initializeFirestore(
  app,
  {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  },
  DATABASE_ID === 'default' ? undefined : DATABASE_ID
);

export default db;
