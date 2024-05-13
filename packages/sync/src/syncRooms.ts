import { Room, roomConverter } from '@cred/shared';
import { getGroups } from './lib/creddd';
import { db } from './lib/firebase';
import { sleep } from './lib/utils';

const upsertRoom = async ({
  groupId,
  name,
  userIds,
}: {
  groupId: string;
  name: string;
  userIds: string[];
}) => {
  const roomData: Room = {
    id: groupId,
    name,
    adminUserIds: [],
    userIds: [],
    invitedUserIds: userIds,
    imageUrl: null,
  };

  console.log('upsertRoom', groupId, name, userIds.length);
  await db
    .collection('rooms')
    .withConverter(roomConverter)
    .doc(groupId)
    .set(roomData);
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
          userIds: group.userIds,
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
