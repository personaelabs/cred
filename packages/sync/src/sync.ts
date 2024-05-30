import 'dotenv/config';
import startSyncRooms from './syncRooms';
import syncTrades from './syncTrades';

const sync = async () => {
  await Promise.all([startSyncRooms(), syncTrades()]);
};

sync();
