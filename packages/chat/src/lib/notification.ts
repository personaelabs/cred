import { getMessaging, getToken } from 'firebase/messaging';
import app from './firebase';
import * as Sentry from '@sentry/nextjs';

export const requestNotificationToken = async (): Promise<string | null> => {
  const messaging = getMessaging(app);
  console.log('Requesting permission...');

  /*
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(function(registration) {
        console.log('Registration successful, scope is:', registration.scope);
      })
      .catch(function(err) {
        console.log('Service worker registration failed, error:', err);
      });
  }

  const permission = await Notification.requestPermission();

  console.log('Permission:', permission);
  if (permission !== 'granted') {
    alert('Permission not granted');
    console.error('Permission not granted');
    return null;
  }
  */

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
