import 'dotenv/config';
import { User, userConverter } from '@cred/shared';
import { db } from './lib/firebase';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { sleep } from './lib/utils';
import { Client } from 'pg';
import { pipeline } from 'node:stream/promises';
import { to as copyTo } from 'pg-copy-streams';

const { FC_REPLICA_DB_URL } = process.env;

if (!FC_REPLICA_DB_URL) {
  throw new Error('FC_REPLICA_DB_URL is not defined');
}

export const fcReplicaDb = new Client({
  connectionString: FC_REPLICA_DB_URL,
});

const downloadUsers = async () => {
  const stream = fcReplicaDb.query(
    copyTo(
      "COPY (SELECT fid, display_name, avatar_url, fname FROM profile_with_addresses ORDER BY fid ASC) TO STDOUT DELIMITER ',' CSV HEADER;"
    )
  );

  const outStream = fs.createWriteStream(path.join(__dirname, './output.csv'));

  await pipeline(stream, outStream);
};

interface CsvRow {
  fid: number;
  fname: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

const usersCollection = db.collection('users').withConverter(userConverter);

const processChunk = async (chunk: CsvRow[]) => {
  await Promise.all(
    chunk.map(async user => {
      const userDoc = usersCollection.doc(user.fid.toString());
      const data: User = {
        fid: Number(user.fid),
        username: user.fname || '',
        displayName: user.display_name || '',
        pfpUrl: user.avatar_url || '',
        updatedAt: new Date(),
      };

      await userDoc.set(data, { merge: true });
    })
  );
};

const syncUsers = async () => {
  console.time('downloadUsers');
  await downloadUsers();
  console.timeEnd('downloadUsers');

  const stream = fs
    .createReadStream(path.join(__dirname, './output.csv'))
    .pipe(csv(['fid', 'display_name', 'avatar_url', 'fname']));

  const chunkSize = 10000;
  let chunk: CsvRow[] = [];

  stream
    .on('data', async row => {
      if (chunk.length >= chunkSize) {
        stream.pause();
        console.time('commit');
        await processChunk(chunk);
        console.timeEnd('commit');
        chunk = [];
        stream.resume();
      } else {
        chunk.push(row);
      }
    })
    .on('end', async () => {
      await processChunk(chunk);
    });
};

const startSyncUsers = async () => {
  await fcReplicaDb.connect();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await syncUsers();
    await sleep(1000 * 60 * 60 * 24); // 1 Day
  }
};

export default startSyncUsers;
