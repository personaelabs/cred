import 'dotenv/config';
import {
  idempotencyKeyConverter,
  messageConverter,
  roomConverter,
  userConverter,
  logger,
} from '@cred/shared';
import { getMessaging } from 'firebase-admin/messaging';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { app } from '@cred/firebase';
import { notificationTokens } from './notificationTokens';
import { DRY_RUN } from './utils';

const messaging = getMessaging(app);
const db = getFirestore(app);

const getRoom = async (roomId: string) => {
  const roomDoc = await db
    .collection('rooms')
    .withConverter(roomConverter)
    .doc(roomId)
    .get();
  return roomDoc.data();
};

const getUser = async (userId: string) => {
  const userDoc = await db
    .collection('users')
    .withConverter(userConverter)
    .doc(userId)
    .get();
  return userDoc.data();
};

const idempotencyKeyExsits = async (key: string) => {
  const keyDoc = await db.collection('idempotencyKeys').doc(key).get();
  return keyDoc.exists;
};

const saveIdempotencyKey = async ({
  key,
  messageCreatedAt,
}: {
  key: string;
  messageCreatedAt: Date;
}) => {
  await db
    .collection('idempotencyKeys')
    .withConverter(idempotencyKeyConverter)
    .doc(key)
    .set({ key, messageCreatedAt });
};

const getLatestIdempotencyKey = async () => {
  const keyDoc = await db
    .collection('idempotencyKeys')
    .withConverter(idempotencyKeyConverter)
    .orderBy('messageCreatedAt', 'desc')
    .limit(1)
    .get();

  if (keyDoc.docs.length === 0) {
    return null;
  }

  return keyDoc.docs[0].data();
};

export const sendMessageNotifications = async () => {
  const latestIdempotencyKey = await getLatestIdempotencyKey();

  const startTimestamp = Timestamp.fromDate(
    (latestIdempotencyKey?.messageCreatedAt as Date) || new Date(0)
  );
  logger.info(`Messages: Starting at ${startTimestamp.toDate()}`);

  const unsubscribe = db
    .collectionGroup('messages')
    .withConverter(messageConverter)
    .where('createdAt', '>=', startTimestamp)
    .onSnapshot(async snapshot => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const doc = change.doc;
          const message = change.doc.data();
          const roomId = message.roomId;

          if (roomId === 'test') {
            logger.debug(`Skipping message ${doc.id} with roomId ${roomId}`);
            continue;
          }

          logger.debug(`New message from ${message.userId}`);

          const room = await getRoom(roomId);

          if (!room) {
            logger.error(`Room ${roomId} not found`);
            continue;
          }

          const userIdsToNotify = room.joinedUserIds.filter(
            fid => message.userId !== fid
          );

          for (const userId of userIdsToNotify) {
            const user = await getUser(userId);
            if (!user) {
              logger.error(`User ${userId} not found`);
              continue;
            }

            if (user.config.notification.mutedRoomIds.includes(roomId)) {
              logger.debug(`User ${userId} muted room ${roomId}`);
              continue;
            }

            const tokens = notificationTokens.get(userId);

            if (tokens) {
              for (const token of tokens) {
                const idempotencyKey = `${token.token}:${doc.id}`;

                if (message.createdAt === null) {
                  logger.error(`message.createdAt is null`);
                  continue;
                }

                if (message.createdAt < token.createdAt) {
                  logger.debug(
                    `Notification token for ${userId} newer than message ${message.createdAt} < ${token.createdAt}`
                  );
                  continue;
                }

                if (!(await idempotencyKeyExsits(idempotencyKey))) {
                  if (!DRY_RUN) {
                    try {
                      const messageId = await messaging.send({
                        notification: {
                          title: 'New message',
                          body: message.body,
                        },
                        data: {
                          fid: message.userId.toString(),
                          path: `/rooms/${roomId}`,
                        },
                        token: token.token,
                        webpush: {
                          fcmOptions: {
                            link: `/rooms/${roomId}`,
                          },
                        },
                      });

                      logger.info(`New message notification sent`, {
                        messageId,
                        userId,
                        roomId,
                      });
                    } catch (err) {
                      logger.error(
                        `Error sending notification to ${userId}`,
                        err
                      );
                    }

                    await saveIdempotencyKey({
                      key: idempotencyKey,
                      messageCreatedAt: message.createdAt as Date,
                    });
                  } else {
                    logger.debug(
                      `Skipping notification for ${userId} in dev mode`
                    );
                  }
                } else {
                  logger.debug(`Idempotency key exists for ${idempotencyKey}`);
                }
              }
            }
          }
        }
      }
    });

  process.on('exit', () => {
    unsubscribe();
  });
};
