import { Room, roomConverter, createRpcClient } from '@cred/shared';
import logger from './lib/logger';
import { sleep } from './lib/utils';
import { getFirestore } from 'firebase-admin/firestore';
import { app } from '@cred/firebase-admin';

const db = getFirestore(app);

const upsertRoom = async ({
  groupId,
  name,
}: {
  groupId: string;
  name: string;
}) => {
  const roomData: Omit<
    Room,
    'joinedUserIds' | 'readerIds' | 'writerIds' | 'isFeatured'
  > = {
    id: groupId,
    name,
    imageUrl: null,
  };

  const groupDoc = await db
    .collection('rooms')
    .withConverter(roomConverter)
    .doc(groupId);

  const group = await groupDoc.get();

  if (group.exists) {
    logger.info('upsertRoom', { groupId, name });
    await groupDoc.update(roomData);
  } else {
    const newRoomData: Room = {
      ...roomData,
      writerIds: [],
      joinedUserIds: [],
      readerIds: [],
      isFeatured: false,
    };
    await groupDoc.set(newRoomData);
  }
};

const credddRpcClient = createRpcClient(
  'https://cred-indexer-41hd.onrender.com'
);

const syncRooms = async () => {
  const groups = await credddRpcClient.getGroups();

  const chunkSize = 1000;

  for (let i = 0; i < groups.length; i += chunkSize) {
    const chunk = groups.slice(i, i + chunkSize);

    await Promise.all(
      chunk.map(async group => {
        return upsertRoom({
          groupId: group.id,
          name: group.display_name,
        });
      })
    );
  }
};

const startSyncRooms = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.time('syncRooms');
    await syncRooms();
    console.timeEnd('syncRooms');
    await sleep(1000 * 60 * 60 * 24); // 1 Day
  }
};

export default startSyncRooms;
