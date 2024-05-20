import 'dotenv/config';
import { credddDb } from './lib/creddd';
import startSyncRooms from './syncRooms';
import syncTrades from './syncTrades';

const sync = async () => {
  await credddDb.connect();
  await Promise.all([startSyncRooms(), syncTrades()]);
  await credddDb.end();
};

sync();
