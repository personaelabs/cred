import 'dotenv/config';
import { credddDb } from './lib/creddd';
import startSyncRooms from './syncRooms';
// import startSyncUsers from './syncUsers';

console.log('RENDER_GIT_BRANCH', process.env.RENDER_GIT_BRANCH);

const sync = async () => {
  await credddDb.connect();

  await Promise.all([startSyncRooms()]);

  await credddDb.end();
};

sync();
