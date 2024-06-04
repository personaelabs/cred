import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { app } from '@cred/firebase';
import { userConverter } from '@cred/shared';

const db = getFirestore(app);

export const addUserConnectedAddress = async ({
  userId,
  address,
}: {
  userId: string;
  address: string;
}) => {
  const usersRef = db.collection('users').withConverter(userConverter);

  const userRef = usersRef.doc(userId);

  const user = await userRef.get();

  if (!user.exists) {
    throw new Error('User does not exist');
  }

  if (user.data()?.connectedAddresses.includes(address)) {
    console.log('Address already connected');
  } else {
    await db
      .collection('users')
      .doc(userId)
      .update({
        connectedAddresses: FieldValue.arrayUnion(address),
      });
  }
};
