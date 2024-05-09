import { groupConverter } from '@cred/shared';
import { getGroups } from './lib/creddd';
import { db } from './lib/firebase';
import { sleep } from './lib/utils';

const syncGroups = async () => {
  const groups = await getGroups();

  const chunkSize = 1000;

  for (let i = 0; i < groups.length; i += chunkSize) {
    const chunk = groups.slice(i, i + chunkSize);

    await Promise.all(
      chunk.map(async group => {
        const groupDoc = db
          .collection('groups')
          .withConverter(groupConverter)
          .doc(group.id.toString());

        await groupDoc.set(
          { ...group, updatedAt: new Date() },
          { merge: true }
        );
      })
    );
  }
};

const startSyncGroups = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.time('syncGroups');
    await syncGroups();
    console.timeEnd('syncGroups');
    await sleep(1000 * 60 * 60 * 24); // 1 Day
  }
};

export default startSyncGroups;
