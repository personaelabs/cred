import RocksDB from 'rocksdb';
import rocksdb from 'rocksdb';
import path from 'path';

export const db = rocksdb(path.join(__dirname, '../../../db'));

export const open = async () => {
  return new Promise((resolve, reject) => {
    db.open({}, err => {
      if (err) {
        reject(err);
      } else {
        resolve(null);
      }
    });
  });
};

export const close = async () => {
  return new Promise((resolve, reject) => {
    db.close(err => {
      if (err) {
        reject(err);
      } else {
        resolve(null);
      }
    });
  });
};

export const get = async (key: RocksDB.Bytes) => {
  return new Promise<RocksDB.Bytes | null>((resolve, reject) => {
    db.get(key, (err, value) => {
      if (err) {
        reject(err);
      } else {
        resolve(value);
      }
    });
  });
};

export interface PutBatch<K = any, V = any> {
  readonly type: 'put';
  readonly key: K;
  readonly value: V;
}

export const putBatch = async (
  ops: {
    key: RocksDB.Bytes;
    value: RocksDB.Bytes;
  }[]
) => {
  const data: {
    key: RocksDB.Bytes;
    value: RocksDB.Bytes;
    type: 'put';
  }[] = ops.map(op => {
    return {
      ...op,
      type: 'put',
    };
  });

  return new Promise((resolve, reject) => {
    db.batch(data, err => {
      if (err) {
        reject(err);
      } else {
        resolve(null);
      }
    });
  });
};

/*
const test = async () => {
  await open();

  const iterator = db.iterator();
  const prefix = Buffer.alloc(2);
  prefix.writeInt16BE(2, 0);

  console.log('prefix', prefix, prefix.toString('hex'));

  iterator.seek(prefix);
  const prefixHex = prefix.toString('hex');

  // Use a loop to iterate through key-value pairs
  const result: any[] = [];
  await new Promise((resolve, reject) => {
    function next() {
      iterator.next((err, key, value) => {
        if (err) {
          reject(err);
          return;
        }
        if (
          Buffer.from((key as Buffer).buffer.slice(0, 2)).toString('hex') ===
          prefixHex
        ) {
          result.push({
            key,
            value,
          });
          next(); // Continue iterating
        } else {
          console.log(key);
          console.log('done');
          resolve(null); // Finished iterating
        }
      });
    }
    next(); // Start iterating
  });

  console.log(result[result.length - 1]);
  db.close(() => {});
};
*/
