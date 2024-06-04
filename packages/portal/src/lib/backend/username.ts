import { app } from '@cred/firebase';
import { userConverter } from '@cred/shared';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore(app);

export const usernameExists = async (username: string) => {
  const usersRef = db.collection('users').withConverter(userConverter);
  const querySnapshot = await usersRef.where('username', '==', username).get();

  return !querySnapshot.empty;
};

export const setUsername = async ({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) => {
  const usersRef = db.collection('users').withConverter(userConverter);
  const userRef = usersRef.doc(userId);

  const user = await userRef.get();

  if (!user.exists) {
    throw new Error('User does not exist');
  }

  await db.collection('users').doc(userId).update({
    username,
  });

  return username;
};
