import { app } from '@cred/firebase';
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
    return inviteCode === 'test';
  }

  const inviteCodeDoc = await db
    .collection('inviteCodes')
    .where('code', '==', inviteCode)
    .where('isUsed', '==', false)
    .get();

  return inviteCodeDoc.docs.length > 0;
};

/**
 * Mark an invite code as used.
 */
export const markInviteCodeAsUsed = async (inviteCode: string) => {
  const inviteCodeDoc = await db
    .collection('inviteCodes')
    .where('code', '==', inviteCode)
    .get();

  if (inviteCodeDoc.docs.length === 0) {
    throw new Error('Invite code not found');
  }

  const doc = inviteCodeDoc.docs[0];

  await doc.ref.update({ isUsed: true });
};
