import 'dotenv/config';
import { credddDb } from './lib/creddd';
import startSyncRooms from './syncRooms';

const sync = async () => {
  await credddDb.connect();
  await Promise.all([startSyncRooms()]);
  await credddDb.end();
};

sync();
