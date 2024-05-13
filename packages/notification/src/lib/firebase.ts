import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({
  credential: applicationDefault(),
});

const RENDER_GIT_BRANCH = process.env.RENDER_GIT_BRANCH;
const DATABASE_ID = RENDER_GIT_BRANCH
  ? RENDER_GIT_BRANCH.replaceAll('/', '-')
  : 'default';

console.log('DATABASE_ID', DATABASE_ID);

export const db =
  DATABASE_ID === 'default'
    ? getFirestore(app)
    : getFirestore(app, DATABASE_ID);

export default app;
