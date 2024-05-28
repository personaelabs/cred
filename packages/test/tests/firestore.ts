import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: 'AIzaSyD5PBvcx99lvcXzWxl-ZiB5AuPaOCcBT2U',
  authDomain: 'daniel-423403.firebaseapp.com',
  projectId: 'daniel-423403',
  storageBucket: 'daniel-423403.appspot.com',
  messagingSenderId: '835392214054',
  appId: '1:835392214054:web:4e93d36bef8d29c0dac2e7',
};

const app = initializeApp(config);

export const db = getFirestore(app);

export default app;
