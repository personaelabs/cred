import app from './firebase';
import { CACHE_SIZE_UNLIMITED, initializeFirestore } from 'firebase/firestore';

/*
const { NEXT_PUBLIC_DATABASE_ID } = process.env;
console.log('NEXT_PUBLIC_DATABASE_ID:', NEXT_PUBLIC_DATABASE_ID);

if (!NEXT_PUBLIC_DATABASE_ID) {
  throw new Error('NEXT_PUBLIC_DATABASE_ID is not defined');
}

const DATABASE_ID =
  NEXT_PUBLIC_DATABASE_ID === 'default' ? undefined : NEXT_PUBLIC_DATABASE_ID;
  */

const DATABASE_ID = undefined;

const db = initializeFirestore(
  app,
  {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  },
  DATABASE_ID
);

export default db;
