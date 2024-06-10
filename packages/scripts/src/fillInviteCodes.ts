import 'dotenv/config';
import { app } from '@cred/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { nanoid } from 'nanoid';

const db = getFirestore(app);

const NUM_CODES = 100;

const fillInviteCodes = async () => {
  const inviteCodes = db.collection('inviteCodes');

  const writer = db.batch();

  for (let i = 0; i < NUM_CODES; i++) {
    const code = nanoid(21);

    writer.set(inviteCodes.doc(code), {
      code,
      isUsed: false,
    });
  }

  await writer.commit();
};
fillInviteCodes();
