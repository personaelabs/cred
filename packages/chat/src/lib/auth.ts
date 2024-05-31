import axios from './axios';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

/**
 * Authenticate the signed in user to Firebase
 * @returns true if the user already exists in Firebase.
 * False if the user is new. This is used to determine if the user needs to set up their username.
 */
export const authSignedInUser = async (
  accessToken: string
): Promise<boolean> => {
  const { data } = await axios.post<{ token: string; usernameSet: boolean }>(
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

  return data.usernameSet;
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
