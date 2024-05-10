import { getMessaging, getToken } from 'firebase/messaging';
import app from './firebase';

export const requestNotificationToken = async (): Promise<string | null> => {
  const messaging = getMessaging(app);
  console.log('Requesting permission...');

  /*
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
  } catch (err) {
    alert('Error requesting permission');
    return null;
  }
};
