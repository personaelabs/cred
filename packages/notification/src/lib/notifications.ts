import 'dotenv/config';
import {
  UserNotificationTokens,
  idempotencyKeyConverter,
  messageConverter,
  notificationTokensConvert,
  roomConverter,
} from '@cred/shared';
import { getMessaging } from 'firebase-admin/messaging';
import logger from './logger';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { initAdminApp } from '@cred/firebase';

const IS_PROD = process.env.RENDER === 'true';
logger.info('IS_PROD', IS_PROD);

const firebaseAdmin = initAdminApp();

const messaging = getMessaging(firebaseAdmin);
const db = getFirestore(firebaseAdmin);

const notificationTokens = new Map<string, UserNotificationTokens['tokens']>();

const startNotificationTokensSync = () => {
  const unsubscribe = db
    .collection('notificationTokens')
    .withConverter(notificationTokensConvert)
    .onSnapshot(snapshot => {
      snapshot.docs.forEach(async doc => {
        const data = doc.data();

        console.log(`Found notification token for ${data.userId}`);
        notificationTokens.set(data.userId, data.tokens);
      });
    });

  process.on('exit', () => {
    unsubscribe();
  });
};

const getRoom = async (roomId: string) => {
  const roomDoc = await db
    .collection('rooms')
    .withConverter(roomConverter)
    .doc(roomId)
    .get();

  if (!roomDoc.exists) {
    throw new Error(`Room ${roomDoc.id} doesn't exist`);
  }

  return roomDoc.data();
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

const sendNotifications = async () => {
  // TODO: Get the last notification message id and start from there
  const latestIdempotencyKey = await getLatestIdempotencyKey();

  const startTimestamp = Timestamp.fromDate(
    (latestIdempotencyKey?.messageCreatedAt as Date) || new Date(0)
  );
  logger.info(`Starting at ${startTimestamp.toDate()}`);

  const unsubscribe = db
    .collectionGroup('messages')
    .withConverter(messageConverter)
    .where('createdAt', '>=', startTimestamp)
    .onSnapshot(async snapshot => {
      for (const change of snapshot.docChanges()) {
        logger.info(`Change type: ${change.type}`);
        if (change.type === 'added') {
          const doc = change.doc;
          const message = change.doc.data();
          const roomId = message.roomId;

          if (roomId === 'test') {
            logger.info(`Skipping message ${doc.id} with roomId ${roomId}`);
            continue;
          }

          logger.info(`New message from ${message.userId}`);

          const room = await getRoom(roomId);

          if (!room) {
            logger.error(`Room ${roomId} not found`);
            continue;
          }

          const userIdsToNotify = room.joinedUserIds.filter(
            fid => message.userId !== fid
          );

          for (const userId of userIdsToNotify) {
            const tokens = notificationTokens.get(userId);

            if (tokens) {
              logger.info(`Found ${tokens.length} tokens for ${userId}`);
              for (const token of tokens) {
                const idempotencyKey = `${token.token}:${doc.id}`;

                if (message.createdAt === null) {
                  logger.error(`message.createdAt is null`);
                  continue;
                }

                if (message.createdAt < token.createdAt) {
                  logger.info(
                    `Notification token for ${userId} newer than message ${message.createdAt} < ${token.createdAt}`
                  );
                  continue;
                }

                if (!(await idempotencyKeyExsits(idempotencyKey))) {
                  logger.info(`Sending notification to ${userId}`);

                  if (IS_PROD) {
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

                    logger.info(`Message sent with ID: ${messageId}`);
                    await saveIdempotencyKey({
                      key: idempotencyKey,
                      messageCreatedAt: message.createdAt as Date,
                    });
                  } else {
                    logger.info(
                      `Skipping notification for ${userId} in dev mode`
                    );
                  }
                } else {
                  logger.info(`Idempotency key exists for ${idempotencyKey}`);
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

const startNotificationJobs = async () => {
  await Promise.all([sendNotifications(), startNotificationTokensSync()]);
};

export default startNotificationJobs;
