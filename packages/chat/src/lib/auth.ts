import axios from './axios';
import { SignedInUser } from '@/types';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { log } from './logger';

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

export const isAuthenticated = async (fid: number) => {
  await getAuth().authStateReady();
  const user = getAuth().currentUser;
  log(`usr ${user?.uid}`);
  if (!user) {
    return false;
  }

  return user.uid === fid.toString();
};
