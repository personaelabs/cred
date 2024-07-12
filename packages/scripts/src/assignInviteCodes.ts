import 'dotenv/config';
import { app } from '@cred/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { nanoid } from 'nanoid';
import { inviteCodeConverter, userConverter } from '@cred/shared';

const db = getFirestore(app);

const NUM_INVITE_CODES_PER_USER = 5;

const assignInviteCodes = async () => {
  const userDocs = await db
    .collection('users')
    .withConverter(userConverter)
    .get();
  const users = userDocs.docs.map(doc => doc.data());

  // For each user, assign NUM_INVITE_CODES_PER_USER invite codes
  for (const user of users) {
    const inviteCodes = db
      .collection('inviteCodes')
      .withConverter(inviteCodeConverter);

    const writer = db.batch();

    for (let i = 0; i < NUM_INVITE_CODES_PER_USER; i++) {
      const code = nanoid(21);

      writer.set(inviteCodes.doc(code), {
        code,
        inviterId: user.id,
        isUsed: false,
      });
    }

    await writer.commit();
  }
};

assignInviteCodes();
