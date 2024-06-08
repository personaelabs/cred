import { app } from '@cred/firebase';
import { userConverter } from '@cred/shared';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore(app);

/**
 * Check if an invite code is valid.
 * @returns {boolean} Whether the invite code is valid.
 */
export const isValidInviteCode = async (inviteCode: string) => {
  // In development or pull requests, allow the invite code "test".
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.IS_PULL_REQUEST === 'true'
  ) {
    if (inviteCode === 'test') {
      return true;
    }
  }

  const inviteCodeDoc = await db
    .collection('inviteCodes')
    .where('code', '==', inviteCode)
    .where('isUsed', '==', false)
    .get();

  return inviteCodeDoc.docs.length > 0;
};

const assignInviteCodeToUser = async ({
  inviteCode,
  userId,
}: {
  inviteCode: string;
  userId: string;
}) => {
  await db
    .collection('users')
    .doc(userId)
    .withConverter(userConverter)
    .update({ inviteCode });
};

/**
 * Mark an invite code as used.
 */
export const markInviteCodeAsUsed = async ({
  inviteCode,
  userId,
}: {
  inviteCode: string;
  userId: string;
}) => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.IS_PULL_REQUEST === 'true'
  ) {
    if (inviteCode === 'test') {
      // Assign the invite code to the user
      await assignInviteCodeToUser({
        inviteCode,
        userId,
      });
      return;
    }
  }

  // Mark the invite code as used
  const inviteCodeDoc = await db
    .collection('inviteCodes')
    .where('code', '==', inviteCode)
    .get();

  if (inviteCodeDoc.docs.length === 0) {
    throw new Error('Invite code not found');
  }

  const doc = inviteCodeDoc.docs[0];

  await doc.ref.update({ isUsed: true });

  // Assign the invite code to the user
  await assignInviteCodeToUser({
    inviteCode,
    userId,
  });
};
