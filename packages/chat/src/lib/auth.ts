import axios from './axios';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { SignedInUser } from '@/types';

/**
 * Authenticate the signed in user to Firestore
 */
export const authSignedInUser = async (signedInUser: SignedInUser) => {
  const { data } = await axios.post<{ token: string }>(
    '/api/signin',
    signedInUser
  );

  await getAuth().authStateReady();
  await signInWithCustomToken(getAuth(), data.token);
};

export const isAuthenticated = async (userId: string) => {
  await getAuth().authStateReady();
  const user = getAuth().currentUser;

  if (!user) {
    return false;
  }

  return user.uid === userId;
};
