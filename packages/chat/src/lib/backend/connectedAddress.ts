import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { app } from '@cred/firebase';

const db = getFirestore(app);

export const addUserConnectedAddress = async ({
  userId,
  address,
}: {
  userId: string;
  address: string;
}) => {
  await db
    .collection('users')
    .doc(userId)
    .update({
      connectedAddresses: FieldValue.arrayUnion(address),
    });
};
