import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({
  credential: applicationDefault(),
});

const RENDER_GIT_BRANCH = process.env.RENDER_GIT_BRANCH;
const IS_PULL_REQUEST = process.env.IS_PULL_REQUEST === 'true';

const DATABASE_ID = IS_PULL_REQUEST
  ? RENDER_GIT_BRANCH!.replaceAll('/', '-')
  : process.env.DATABASE_ID;

if (!DATABASE_ID) {
  throw new Error('DATABASE_ID is required');
}

console.log('DATABASE_ID', DATABASE_ID);

export const db =
  DATABASE_ID === 'default'
    ? getFirestore(app)
    : getFirestore(app, DATABASE_ID);

export default app;
