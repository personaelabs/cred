import { collection, getDocs, query, where } from 'firebase/firestore';
import db from './firestore';
import { userConverter } from '@cred/shared';

/**
 * Check if the username is available in Portal.
 */
export const isUsernameAvailable = async (username: string) => {
  const usersRef = collection(db, 'users').withConverter(userConverter);

  const q = query(usersRef, where('username', '==', username));

  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};
