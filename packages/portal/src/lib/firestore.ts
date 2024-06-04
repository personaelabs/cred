import app from './firebase';
import { CACHE_SIZE_UNLIMITED, initializeFirestore } from 'firebase/firestore';

const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

export default db;
