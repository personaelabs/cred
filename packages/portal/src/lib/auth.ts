import { SignInResponse } from '@/types';
import axios from './axios';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

/**
 * Authenticate the signed in user to Firebase
 * @returns true if the user already exists in Firebase.
 * False if the user is new. This is used to determine if the user needs to set up their username.
 */
export const authSignedInUser = async ({
  accessToken,
}: {
  accessToken: string;
}): Promise<SignInResponse> => {
  const { data } = await axios.post<SignInResponse>(
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

  return data;
};
