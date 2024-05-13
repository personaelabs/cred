import 'dotenv/config';
import startNotificationsJob from './lib/notifications';

const sync = async () => {
  await startNotificationsJob();
};

sync();
