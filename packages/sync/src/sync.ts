import 'dotenv/config';
import { credddDb } from './lib/creddd';
import startSyncUsers from './syncUsers';
import startSyncGroups from './syncGroups';

console.log('RENDER_GIT_BRANCH', process.env.RENDER_GIT_BRANCH);

const sync = async () => {
  await credddDb.connect();

  await Promise.all([startSyncUsers(), startSyncGroups()]);

  await credddDb.end();
};

sync();
