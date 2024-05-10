import 'dotenv/config';
import { db } from './firebase';
import {
  UserNotificationTokens,
  messageConverter,
  notificationTokensConvert,
  roomConverter,
} from '@cred/shared';
import { getMessaging } from 'firebase-admin/messaging';
import firebaseAdmin from './firebase';

const IS_PROD = process.env.VERCEL_ENV === 'production';

console.log('IS_PROD', IS_PROD);

const messaging = getMessaging(firebaseAdmin);

const notificationTokens = new Map<number, UserNotificationTokens['tokens']>();

const startNotificationTokensSync = () => {
  const unsubscribe = db
    .collection('notificationTokens')
    .withConverter(notificationTokensConvert)
    .onSnapshot(snapshot => {
      snapshot.docs.forEach(async doc => {
        const data = doc.data();

        console.log(`Found notification token for ${data.fid}`);
        notificationTokens.set(data.fid, data.tokens);
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

const saveIdempotencyKey = async (key: string) => {
  await db.collection('idempotencyKeys').doc(key).set({ key });
};

const sendNotifications = () => {
  // Get the last notification message id and start from there
  const unsubscribe = db
    .collectionGroup('messages')
    .withConverter(messageConverter)
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot =>
      snapshot.docs.forEach(async doc => {
        // Get user notification token from the db here
        const message = doc.data();
        const roomId = message.roomId;

        if (roomId === 'test' || !roomId) {
          return;
        }
        console.log(`New message from ${message.fid}`);

        const room = await getRoom(roomId);

        if (!room) {
          console.error(`Room ${roomId} not found`);
          return;
        }

        const fidsToNotify = room.fids.filter(fid => message.fid !== fid);

        for (const fid of fidsToNotify) {
          const tokens = notificationTokens.get(fid);

          if (tokens) {
            console.log(`Found ${tokens.length} tokens for ${fid}`);
            for (const token of tokens) {
              const idempotencyKey = `${token.token}:${doc.id}`;

              console.log(message.createdAt, token.createdAt);

              if (message.createdAt === null) {
                console.error(`message.createdAt is null`);
                continue;
              }

              if (message.createdAt < token.createdAt) {
                console.log(
                  `Notification token for ${fid} newer than message ${message.createdAt} < ${token.createdAt}`
                );
                continue;
              }

              if (!(await idempotencyKeyExsits(idempotencyKey))) {
                console.log(`Sending notification to ${fid}`);

                if (IS_PROD) {
                  const messageId = await messaging.send({
                    notification: {
                      title: 'New message',
                      body: message.body,
                    },
                    data: {
                      fid: message.fid.toString(),
                      path: `/rooms/${roomId}`,
                    },
                    token: token.token,
                  });

                  console.log(`Message sent with ID: ${messageId}`);
                  await saveIdempotencyKey(idempotencyKey);
                }
              } else {
                console.log(`Idempotency key exists for ${idempotencyKey}`);
              }
            }
          }
        }
      })
    );

  process.on('exit', () => {
    unsubscribe();
  });
};

const startNotificationJobs = async () => {
  await Promise.all([sendNotifications(), startNotificationTokensSync()]);
};

startNotificationJobs();
