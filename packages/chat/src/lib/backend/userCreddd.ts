import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { app } from '@cred/firebase';
import { UserCreddd, userCredddConverter } from '@cred/shared';
import * as Sentry from '@sentry/nextjs';

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
  const userCredddRef = db
    .collection('userCreddd')
    .withConverter(userCredddConverter)
    .doc(userId);

  const userCredddDoc = await userCredddRef.get();

  if (userCredddDoc.exists) {
    const existingGroupIds =
      userCredddDoc.data()?.creddd.map(c => c.groupId) || [];

    if (existingGroupIds.includes(creddd.groupId)) {
      Sentry.captureException(
        new Error(`User already has creddd ${creddd.groupId}`)
      );
      console.warn(`User already has creddd ${creddd.groupId}`);
    } else {
      await userCredddRef.update({
        creddd: FieldValue.arrayUnion(creddd),
      });
    }
  } else {
    await userCredddRef.set({
      userId,
      creddd: [creddd],
    });
  }
};
