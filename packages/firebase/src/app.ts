import { applicationDefault, initializeApp } from 'firebase-admin/app';

import { App, getApps } from 'firebase-admin/app';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS must be set');
}

let app: App;
if (getApps().length === 0) {
  app = initializeApp({
    credential: applicationDefault(),
  });
} else {
  app = getApps()[0];
  console.log('Firebase app already initialized.');
}

export default app;
