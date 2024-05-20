import axios from './axios';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

/**
 * Authenticate the signed in user to Firebase
 */
export const authSignedInUser = async (accessToken: string) => {
  const { data } = await axios.post<{ token: string }>(
    '/api/signin',
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  await getAuth().authStateReady();
  await signInWithCustomToken(getAuth(), data.token);
};

/**
 * Returns true if the user is authenticated to the given user ID on Firebase
 */
export const isAuthenticated = async (userId: string) => {
  await getAuth().authStateReady();
  const user = getAuth().currentUser;

  if (!user) {
    return false;
  }

  return user.uid === userId;
};
