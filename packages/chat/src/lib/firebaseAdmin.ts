import { applicationDefault, initializeApp, cert } from 'firebase-admin/app';
const app =
  process.env.NODE_ENV === 'production'
    ? initializeApp({
        credential: cert({
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(
            /\\n/g,
            '\n'
          ),
          projectId: 'cred-279bb',
        }),
      })
    : initializeApp({
        credential: applicationDefault(),
      });
export default app;
