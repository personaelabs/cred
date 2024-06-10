import { getMessaging, getToken } from 'firebase/messaging';
import app from './firebase';
import * as Sentry from '@sentry/nextjs';
import { sleep } from './utils';

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

const NOTIFICATION_ENABLED_KEY = 'portal.notificationsEnabled';

export const isNotificationsEnabled = () => {
  return window.localStorage.getItem(NOTIFICATION_ENABLED_KEY) === 'true';
};

export const saveNotificationEnabled = (enabled: boolean) => {
  window.localStorage.setItem(
    NOTIFICATION_ENABLED_KEY,
    enabled ? 'true' : 'false'
  );
};

export const getDeviceNotificationToken = async (): Promise<string | null> => {
  const messaging = getMessaging(app);

  try {
    const maxRetries = 5;
    let retries = 0;

    // We need to retry because sometimes the service worker is not ready,
    // and there is no stable way to know if the service worker is ready or not.
    while (maxRetries > retries) {
      try {
        const token = await getToken(messaging, {
          vapidKey: NEXT_PUBLIC_VAPID_KEY,
        });

        await sleep(100);

        return token;
      } catch (err: any) {
        console.log(err);
        retries++;
      }
    }

    throw new Error('Failed to get device notification token');
  } catch (err: any) {
    Sentry.captureException(err);
    alert(`Error: ${err.message}`);
    return null;
  }
};
