import 'dotenv/config';
import { arrayUnion, collection, doc, updateDoc } from 'firebase/firestore';
import { shouldDenyOperation } from '../utils';
import app, { db } from '../firestore';
import { userConverter } from '@cred/shared';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { createUser } from './users';
import * as adminUtils from '../adminUtils';
import { deleteApp } from 'firebase/app';

const auth = getAuth();

describe('users', () => {
  describe('unauthenticated', () => {
    it('should deny creating a user', async () => {
      shouldDenyOperation(createUser);
    });
  });

  describe('authenticated', () => {
    let userId: string;
    beforeAll(async () => {
      const user = await signInAnonymously(auth);

      userId = user.user.uid;
      await adminUtils.createUser(userId);
    });

    afterAll(async () => {
      await adminUtils.deleteUser(userId);
    });

    it('should not be able to create a user', () => {
      shouldDenyOperation(createUser);
    });

    it.skip('should be able to update configuration', async () => {
      const userDoc = doc(
        collection(db, 'users').withConverter(userConverter),
        userId
      );

      await updateDoc(userDoc, {
        'config.notification.mutedRoomIds': arrayUnion('test-room'),
      });
    });
  });

  afterAll(async () => {
    await deleteApp(app);
  });
});
