import 'dotenv/config';
import { sendMessageNotifications } from './lib/messageNotifications';
import { sendNewRoomNotifications } from './lib/newRoomNotifications';
import { startNotificationTokensSync } from './lib/notificationTokens';

const sync = async () => {
  await Promise.all([
    startNotificationTokensSync(),
    sendNewRoomNotifications(),
    sendMessageNotifications(),
  ]);
};

sync();
