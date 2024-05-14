import {
  applicationDefault,
  initializeApp,
  getApps,
  App,
} from 'firebase-admin/app';

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
