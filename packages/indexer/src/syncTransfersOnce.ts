import * as rocksdb from './rocksdb';
import { syncTransfers } from './syncTransfers';

const main = async () => {
  await rocksdb.open();
  await syncTransfers();
  await rocksdb.close();
};

main();
