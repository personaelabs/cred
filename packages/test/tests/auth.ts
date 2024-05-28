import { initializeAuth } from 'firebase/auth';
import app from './firestore';

const auth = initializeAuth(app);

export default auth;
