import 'dotenv/config';
import { app } from '@cred/firebase';
import { getFirestore } from 'firebase-admin/firestore';
import { inviteCodeConverter } from '@cred/shared';

const db = getFirestore(app);

const printInviteCodes = async () => {
  const inviteCodes = await db
    .collection('inviteCodes')
    .withConverter(inviteCodeConverter)
    .get();

  const codes = inviteCodes.docs.map(doc => doc.data().code);

  for (const code of codes) {
    console.log(code);
  }
};
printInviteCodes();
