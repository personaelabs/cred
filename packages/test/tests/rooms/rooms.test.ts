import 'dotenv/config';
import { describe, it } from '@jest/globals';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import app from '../firestore';
import { deleteApp } from 'firebase/app';
import { roomConverter } from '@cred/shared';
import { TEST_ROOM_ID, getRoom, joinRoom } from './room';
import { addWriterToRoom } from '@cred/firebase';
import { signInAnonymously, getAuth } from 'firebase/auth';
import * as admin from '../adminUtils';

const db = getFirestore(app);
const auth = getAuth();

const getRoomsRef = () => collection(db, 'rooms').withConverter(roomConverter);

describe('rooms', () => {
  beforeAll(async () => {
    await admin.initTestRoom();
  });

  describe('unauthenticated', () => {
    it('should allow reading the room document', async () => {
      expect(async () => {
        await getDocs(getRoomsRef());
      }).not.toThrow();
    });
  });

  afterAll(async () => {
    await admin.deleteRoom(TEST_ROOM_ID);
    await deleteApp(app);
  });

  describe('As room admin', () => {
    let adminId: string;

    // Sign in as an anonymous user and add the user as a writer to the room
    beforeAll(async () => {
      const { user } = await signInAnonymously(auth);

      adminId = user.uid;

      await addWriterToRoom({
        roomId: TEST_ROOM_ID,
        userId: adminId,
      });
    });

    afterAll(async () => {
      await admin.deleteUser(adminId);
    });

    it('should be able to join room', async () => {
      await joinRoom({
        roomId: TEST_ROOM_ID,
        userId: adminId,
      });

      const room = await getRoom(TEST_ROOM_ID);
      expect(room?.joinedUserIds).toContain(adminId);
    });
  });
});
