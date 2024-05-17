import { applicationDefault, initializeApp } from 'firebase-admin/app';

export const initAdminApp = () => {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS must be set');
  }

  const app = initializeApp({
    credential: applicationDefault(),
  });

  return app;
};
