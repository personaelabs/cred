import { initAdminApp } from '@cred/firebase';
import { App, getApps } from 'firebase-admin/app';

let app: App;
if (getApps().length === 0) {
  app = initAdminApp();
} else {
  app = getApps()[0];
  console.log('Firebase app already initialized.');
}

export default app;
