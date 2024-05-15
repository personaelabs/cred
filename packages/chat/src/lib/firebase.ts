import { initializeApp } from 'firebase/app';

// Initialize Firebase
const firebaseConfig = {
  projectId: 'daniel-423403',
  appId: '1:835392214054:web:4e93d36bef8d29c0dac2e7',
  storageBucket: 'daniel-423403.appspot.com',
  apiKey: 'AIzaSyD5PBvcx99lvcXzWxl-ZiB5AuPaOCcBT2U',
  authDomain: 'daniel-423403.firebaseapp.com',
  messagingSenderId: '835392214054',
};

const app = initializeApp(firebaseConfig);

export default app;
