import { Room, roomConverter } from '@cred/shared';
import { getGroups } from './lib/creddd';
import { db } from './lib/firebase';
import { sleep } from './lib/utils';

const upsertRoom = async ({
  groupId,
  name,
  writerIds,
}: {
  groupId: string;
  name: string;
  writerIds: string[];
}) => {
  const roomData: Omit<Room, 'joinedUserIds' | 'readerIds'> = {
    id: groupId,
    name,
    writerIds,
    imageUrl: null,
  };

  const groupDoc = await db
    .collection('rooms')
    .withConverter(roomConverter)
    .doc(groupId);

  const group = await groupDoc.get();

  if (group.exists) {
    console.log('upsertRoom', groupId, name);
    await groupDoc.update(roomData);
  } else {
    const newRoomData: Room = {
      ...roomData,
      joinedUserIds: [],
      readerIds: [],
    };
    console.log('createRoom', groupId, name);
    await groupDoc.set(newRoomData);
  }
};

const syncRooms = async () => {
  const groups = await getGroups();

  const chunkSize = 1000;

  for (let i = 0; i < groups.length; i += chunkSize) {
    const chunk = groups.slice(i, i + chunkSize);

    await Promise.all(
      chunk.map(async group => {
        return upsertRoom({
          groupId: group.id,
          name: group.displayName,
          writerIds: group.fids.map(fid => fid.toString()),
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
