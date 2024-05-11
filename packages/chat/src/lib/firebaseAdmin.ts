import {
  applicationDefault,
  initializeApp,
  cert,
  getApps,
  App,
} from 'firebase-admin/app';

let app: App;

if (getApps().length === 0) {
  if (process.env.NODE_ENV === 'production') {
    app = initializeApp({
      credential: cert({
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(
          /\\n/g,
          '\n'
        ),
        projectId: 'cred-279bb',
      }),
    });
  } else {
    app = initializeApp({
      credential: applicationDefault(),
    });
  }
} else {
  app = getApps()[0];
  console.log('Firebase app already initialized.');
}

export default app;
