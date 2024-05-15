import { getMessaging, getToken } from 'firebase/messaging';
import app from './firebase';
import * as Sentry from '@sentry/nextjs';

export const isNotificationConfigured = () => {
  return localStorage.getItem('notificationConfigured') === 'true';
};

export const setNotificationConfigured = () => {
  localStorage.setItem('notificationConfigured', 'true');
};

export const requestNotificationToken = async (): Promise<string | null> => {
  const messaging = getMessaging(app);

  try {
    const token = await getToken(messaging, {
      vapidKey:
        'BHaVlakB8SbeMEprNB2e6FQtlPMFjyWEhMnBH8dKn-q2epYPi--NNCWM2EZmsjaXUQ0FbKpPuppmC-Od6xL0M88',
    });

    return token;
  } catch (err: any) {
    Sentry.captureException(err);
    alert(`Error: ${err.message}`);
    return null;
  }
};
