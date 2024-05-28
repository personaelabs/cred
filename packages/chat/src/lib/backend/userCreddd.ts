import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { app } from '@cred/firebase';
import { UserCreddd, userCredddConverter } from '@cred/shared';

const db = getFirestore(app);

export const addUserCreddd = async ({
  userId,
  creddd,
}: {
  userId: string;
  creddd: UserCreddd['creddd'][number];
}) => {
  // Add the group id to the user's document
  const userRef = db.collection('users').doc(userId);
  await userRef.update({
    addedCreddd: FieldValue.arrayUnion(creddd.groupId),
  });

  // Save the proof
  const usersCredddRef = db
    .collection('usersCreddd')
    .withConverter(userCredddConverter);

  const userCredddRef = usersCredddRef.doc(userId);
  const userCredddDoc = await userCredddRef.get();

  if (userCredddDoc.exists) {
    await userCredddRef.update({
      creddd: FieldValue.arrayUnion(creddd),
    });
  } else {
    await userCredddRef.set({
      userId,
      creddd: [creddd],
    });
  }
};
