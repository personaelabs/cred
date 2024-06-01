import { DocumentData } from 'firebase/firestore';

import { InviteCode } from '../types';

export const inviteCodeConverter = {
  toFirestore: (inviteCode: InviteCode) => {
    return {
      code: inviteCode.code,
      isUsed: inviteCode.isUsed,
    };
  },
  fromFirestore: (snapshot: DocumentData) => {
    const data = snapshot.data();

    const room: InviteCode = {
      code: data.code,
      isUsed: data.isUsed,
    };

    return room;
  },
};
