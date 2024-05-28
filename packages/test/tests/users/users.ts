import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firestore';
import { userConverter } from '@cred/shared';

export const createUser = async () => {
  const usersCollection = collection(db, 'users').withConverter(userConverter);

  await addDoc(usersCollection, {
    id: 'test',
    username: 'test',
    displayName: 'test',
    pfpUrl: 'test',
    privyAddress: 'test',
    connectedAddresses: [],
    config: {
      notification: {
        mutedRoomIds: [],
      },
    },
  });
};
