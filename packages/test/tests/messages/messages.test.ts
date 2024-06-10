import 'dotenv/config';
import { describe, it } from '@jest/globals';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import app from '../firestore';
import { deleteApp } from 'firebase/app';
import { MessageVisibility } from '@cred/shared';
import { TEST_ROOM_ID, getRoom, joinRoom } from '../rooms/room';
import { addReaderToRoom, addWriterToRoom } from '@cred/firebase-admin';
import { signInAnonymously, signOut } from 'firebase/auth';
import * as admin from '../adminUtils';
import { createMessage } from './messages';
import { shouldDenyOperation } from '../utils';
import auth from '../auth';
import { db } from '../firestore';

describe('messages', () => {
  beforeAll(async () => {
    await admin.initTestRoom();
  });

  describe('unauthenticated', () => {
    it('should deny message reads form a user who is not in the room', async () => {
      const room = await getRoom(TEST_ROOM_ID);

      if (!room) {
        throw new Error('Room not found');
      }

      shouldDenyOperation(async () => {
        await getDocs(collection(db, 'rooms', room?.id, 'messages'));
      });
    });
  });

  describe('As room admin', () => {
    let adminId: string;

    // Sign in as an anonymous user and add the user as a writer to the room
    beforeAll(async () => {
      if (auth.currentUser) {
        await signOut(auth);
      }
      const { user } = await signInAnonymously(auth);

      adminId = user.uid;

      await addWriterToRoom({
        roomId: TEST_ROOM_ID,
        userId: adminId,
      });

      await joinRoom({
        roomId: TEST_ROOM_ID,
        userId: adminId,
      });
    });

    afterAll(async () => {
      await admin.deleteUser(adminId);
    });

    it('should be able to send public message in room', async () => {
      await createMessage({
        roomId: TEST_ROOM_ID,
        userId: adminId,
        visibility: MessageVisibility.PUBLIC,
      });
    });

    it('should be able to make message public', async () => {
      const message = await admin.createMessage({
        roomId: TEST_ROOM_ID,
        userId: 'fake-user-id',
        visibility: MessageVisibility.ONLY_ADMINS,
      });

      await updateDoc(
        doc(collection(db, 'rooms', TEST_ROOM_ID, 'messages'), message.id),
        {
          visibility: MessageVisibility.PUBLIC,
        }
      );
    });

    it('should reject when data.userId != auth.userId', async () => {
      shouldDenyOperation(async () => {
        await createMessage({
          roomId: TEST_ROOM_ID,
          userId: `invalid-${adminId}`,
          visibility: MessageVisibility.PUBLIC,
        });
      });
    });
  });

  describe('As room buyer', () => {
    let buyerId: string;

    // Sign in as an anonymous user and add the user as a writer to the room
    beforeAll(async () => {
      if (auth.currentUser) {
        await signOut(auth);
      }
      const { user } = await signInAnonymously(auth);

      buyerId = user.uid;

      await addReaderToRoom({
        roomId: TEST_ROOM_ID,
        userId: buyerId,
      });

      await joinRoom({
        roomId: TEST_ROOM_ID,
        userId: buyerId,
      });
    });

    afterAll(async () => {
      await admin.deleteUser(buyerId);
    });

    it('should be able to send admin-only message in room', async () => {
      await createMessage({
        roomId: TEST_ROOM_ID,
        userId: buyerId,
        visibility: MessageVisibility.ONLY_ADMINS,
      });
    });

    it('should not be able to send public message in room', async () => {
      shouldDenyOperation(async () => {
        await createMessage({
          roomId: TEST_ROOM_ID,
          userId: buyerId,
          visibility: MessageVisibility.PUBLIC,
        });
      });
    });

    it('should not be able to make message public', async () => {
      const message = await createMessage({
        roomId: TEST_ROOM_ID,
        userId: buyerId,
        visibility: MessageVisibility.ONLY_ADMINS,
      });

      shouldDenyOperation(async () => {
        await updateDoc(
          doc(collection(db, 'rooms', TEST_ROOM_ID, 'messages'), message.id),
          {
            visibility: MessageVisibility.PUBLIC,
          }
        );
      });
    });

    it('should not be able to make other user`s public', async () => {
      const message = await admin.createMessage({
        roomId: TEST_ROOM_ID,
        userId: 'fake-user-id',
        visibility: MessageVisibility.ONLY_ADMINS,
      });

      shouldDenyOperation(async () => {
        await updateDoc(
          doc(collection(db, 'rooms', TEST_ROOM_ID, 'messages'), message.id),
          {
            visibility: MessageVisibility.PUBLIC,
          }
        );
      });
    });

    it('should reject when data.userId != auth.userId', async () => {
      expect(async () => {
        await createMessage({
          roomId: TEST_ROOM_ID,
          userId: `invalid-${buyerId}`,
          visibility: MessageVisibility.PUBLIC,
        });
      }).rejects.toThrow();
    });
  });

  afterAll(async () => {
    await admin.deleteRoom(TEST_ROOM_ID);
    await deleteApp(app);
  });
});
