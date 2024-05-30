import { getMessaging, getToken } from 'firebase/messaging';
import app from './firebase';
import * as Sentry from '@sentry/nextjs';

const NEXT_PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY;

if (!NEXT_PUBLIC_VAPID_KEY) {
  throw new Error('NEXT_PUBLIC_VAPID_KEY key not found');
}

export const isNotificationConfigured = () => {
  return localStorage.getItem('notificationConfigured') === 'true';
};

export const setNotificationConfigured = () => {
  localStorage.setItem('notificationConfigured', 'true');
};

export const getDeviceNotificationToken = async (): Promise<string | null> => {
  const messaging = getMessaging(app);

  try {
    const token = await getToken(messaging, {
      vapidKey: NEXT_PUBLIC_VAPID_KEY,
    });

    return token;
  } catch (err: any) {
    Sentry.captureException(err);
    alert(`Error: ${err.message}`);
    return null;
  }
};
