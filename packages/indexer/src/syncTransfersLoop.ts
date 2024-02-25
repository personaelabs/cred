import * as rocksdb from './rocksdb';
import { syncTransfers } from './syncTransfers';
import { sleep } from './utils';

const syncTransfersLoop = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await rocksdb.open();
    await syncTransfers();
    await sleep(1000 * 5 * 60); // 5 minutes
    await rocksdb.close();
  }
};

syncTransfersLoop();
