import { app } from '@cred/firebase';
import {
  newRoomNotifyIdempotencyKeyConverter,
  roomConverter,
} from '@cred/shared';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { notificationTokens } from './notificationTokens';
import { DRY_RUN } from './utils';
import logger from './logger';

const messaging = getMessaging(app);
const db = getFirestore(app);

const idempotencyKeyExsits = async (key: string) => {
  const keyDoc = await db
    .collection('newRoomNotifyIdempotencyKeys')
    .doc(key)
    .get();
  return keyDoc.exists;
};

const saveIdempotencyKey = async ({
  key,
  createdAt,
}: {
  key: string;
  createdAt: Date;
}) => {
  await db
    .collection('newRoomNotifyIdempotencyKeys')
    .withConverter(newRoomNotifyIdempotencyKeyConverter)
    .doc(key)
    .set({ key, createdAt });
};

export const sendNewRoomNotifications = async () => {
  const roomToWriterIds = new Map<string, string[]>();

  // Backfill the roomToWriterIds map
  const roomsSnapshot = await db.collection('rooms').get();
  for (const roomDoc of roomsSnapshot.docs) {
    const room = roomDoc.data();
    roomToWriterIds.set(room.id, room.writerIds);
  }

  logger.info(`Backfilled ${roomToWriterIds.size} rooms`);

  db.collection('rooms')
    .withConverter(roomConverter)
    .onSnapshot(async snapshot => {
      for (const change of snapshot.docChanges()) {
        const room = change.doc.data();

        const newWriterIds = room.writerIds;

        const existingWriters = roomToWriterIds.get(room.id) || [];

        const addedWriterIds = newWriterIds.filter(
          writerId => !existingWriters.includes(writerId)
        );

        // Send notifications to the added writers
        for (const writerId of addedWriterIds) {
          const tokens = notificationTokens.get(writerId);
          if (!tokens) {
            continue;
          }

          for (const token of tokens) {
            const idempotencyKey = `${token.token}:${change.doc.id}`;

            if (!(await idempotencyKeyExsits(idempotencyKey))) {
              logger.info(`Notifying ${writerId} about room ${room.name}`);

              if (!DRY_RUN) {
                const message = {
                  notification: {
                    title: `New room`,
                    body: `You are now eligible to start chatting in ${room.name}`,
                  },
                  token: token.token,
                };

                try {
                  const messageId = await messaging.send(message);
                  logger.info(`Message sent with ID: ${messageId}`);

                  await saveIdempotencyKey({
                    key: idempotencyKey,
                    createdAt: new Date(),
                  });
                } catch (error) {
                  console.error(
                    `Error sending notification to ${writerId}`,
                    error
                  );
                }
              }
            } else {
              logger.info(
                `Idempotency key exists for ${writerId} and room ${room.name}`
              );
            }
          }
        }

        // Update the roomToWriterIds map
        roomToWriterIds.set(room.id, newWriterIds);
      }
    });
};
