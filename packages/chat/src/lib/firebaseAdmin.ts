import { applicationDefault, initializeApp } from 'firebase-admin/app';

const app = initializeApp({
  credential: applicationDefault(),
});

export default app;
