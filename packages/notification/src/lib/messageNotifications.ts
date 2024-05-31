import 'dotenv/config';
import {
  idempotencyKeyConverter,
  messageConverter,
  roomConverter,
  userConverter,
  Room,
  Message,
} from '@cred/shared';
import { getMessaging } from 'firebase-admin/messaging';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { app } from '@cred/firebase';
import { notificationTokens } from './notificationTokens';
import { DRY_RUN } from './utils';
import { MessageNotificationType } from '../types';
import logger from './logger';

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

const getMessage = async ({
  roomId,
  messageId,
}: {
  roomId: string;
  messageId: string;
}) => {
  const messageDoc = await db
    .collection('rooms')
    .doc(roomId)
    .collection('messages')
    .withConverter(messageConverter)
    .doc(messageId)
    .get();

  return messageDoc.data();
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

const sendMentionNotification = async ({
  body,
  token,
  room,
  userId,
}: {
  body: string;
  token: string;
  room: Room;
  userId: string;
}) => {
  try {
    const messageId = await messaging.send({
      notification: {
        title: `Mentioned in ${room.name}`,
        body,
      },
      token: token,
      webpush: {
        fcmOptions: {
          link: `/rooms/${room.id}`,
        },
      },
    });

    logger.info(`Mention notification sent`, {
      messageId,
      roomId: room.id,
      userId,
    });
  } catch (err) {
    logger.error(`Error sending notification to ${userId}`, err);
  }
};

const sendReplyNotification = async ({
  body,
  token,
  room,
}: {
  body: string;
  token: string;
  room: Room;
}) => {
  const messageId = await messaging.send({
    notification: {
      title: `Reply in ${room.name}`,
      body,
    },
    token: token,
    webpush: {
      fcmOptions: {
        link: `/rooms/${room.id}`,
      },
    },
  });

  logger.info(`Reply notification sent`, {
    messageId,
    roomId: room.id,
  });
};

/**
 * Notify a user about a message
 * @param userId The user to notify
 * @param messageType The type of message
 * @param room The room the message was sent in
 * @param message The message to notify about
 */
const notifyUserAboutMessage = async ({
  userId,
  messageType,
  room,
  message,
}: {
  userId: string;
  messageType: MessageNotificationType;
  room: Room;
  message: Message;
}) => {
  const roomId = message.roomId;

  const user = await getUser(userId);
  if (!user) {
    logger.error(`User ${userId} not found`);
    return;
  }

  if (user.config.notification.mutedRoomIds.includes(roomId)) {
    logger.debug(`User ${userId} muted room ${roomId}`);
    return;
  }

  // Get the notification tokens for the user
  const tokens = notificationTokens.get(userId) || [];

  if (tokens.length === 0) {
    logger.debug(`No notification tokens for ${userId}`);
    return;
  }

  for (const token of tokens.filter(token => token.enabled)) {
    const idempotencyKey = `${token.token}:${message.id}`;

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

    if (await idempotencyKeyExsits(idempotencyKey)) {
      logger.warn(`Idempotency key exists for ${idempotencyKey}`);
      continue;
    }

    if (!DRY_RUN) {
      try {
        if (messageType === MessageNotificationType.MENTION) {
          await sendMentionNotification({
            body: message.body,
            token: token.token,
            room,
            userId,
          });
        } else if (messageType === MessageNotificationType.REPLY) {
          await sendReplyNotification({
            body: message.body,
            token: token.token,
            room,
          });
        } else {
          logger.error(`Unknown message type ${messageType}`);
        }
      } catch (err) {
        logger.error(`Error sending notification to ${userId}`, err);
      }

      await saveIdempotencyKey({
        key: idempotencyKey,
        messageCreatedAt: message.createdAt as Date,
      });
    } else {
      logger.debug(`Skipping notification for ${userId} in dev mode`);
    }
  }
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
          const message = change.doc.data();
          const roomId = message.roomId;

          logger.debug(`New message from ${message.userId} ${message.replyTo}`);

          const room = await getRoom(roomId);

          if (!room) {
            logger.error(`Room ${roomId} not found`);
            continue;
          }

          // Notify users who were mentioned in the message
          for (const userId of message.mentions) {
            if (userId === message.userId) {
              logger.debug(`Skipping self mention for ${userId}`);
              continue;
            }

            await notifyUserAboutMessage({
              userId,
              messageType: MessageNotificationType.MENTION,
              room,
              message,
            });
          }

          // If the message is a reply, notify the user who was replied to
          if (message.replyTo) {
            const repliedMessage = await getMessage({
              roomId,
              messageId: message.replyTo,
            });

            if (!repliedMessage) {
              logger.error(`Replied message ${message.replyTo} not found`);
            } else {
              await notifyUserAboutMessage({
                userId: repliedMessage.userId,
                messageType: MessageNotificationType.REPLY,
                room,
                message,
              });
            }
          }
        }
      }
    });

  process.on('exit', () => {
    unsubscribe();
  });
};
