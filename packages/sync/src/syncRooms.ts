import { Room, roomConverter, userConverter } from '@cred/shared';
import { sleep } from './lib/utils';
import { getFirestore } from 'firebase-admin/firestore';
import { addWriterToRoom, app } from '@cred/firebase';
import { getGroupData, getGroups, MerkleTree } from '@cred/grpc';
import { Hex, toHex } from 'viem';
// import { getVerifiedAddresses } from './lib/neynar';
import { GroupDataResponse } from '@cred/grpc/out/proto/group_data_pb';

const db = getFirestore(app);

const upsertRoom = async ({
  groupId,
  name,
}: {
  groupId: string;
  name: string;
}) => {
  const roomData: Omit<Room, 'joinedUserIds' | 'readerIds' | 'writerIds'> = {
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
    console.log('upsertRoom', groupId, name);
    await groupDoc.update(roomData);
  } else {
    const newRoomData: Room = {
      ...roomData,
      joinedUserIds: [],
      readerIds: [],
      writerIds: [],
    };
    console.log('createRoom', groupId, name);
    await groupDoc.set(newRoomData);
  }
};

const upsertAdminWriters = async (
  groupId: string,
  groupData: GroupDataResponse.AsObject
) => {
  const merkleTree = MerkleTree.deserializeBinary(
    groupData.latestMerkleTree as Uint8Array
  );
  const layers = merkleTree.getLayersList();
  const nodes = layers[0].getNodesList();
  const addresses = nodes.map(node => toHex(node.getNode()));

  const users = db.collection('users').withConverter(userConverter);
  const userDocs = await users.get();

  const roomId = groupId;

  const adminWriters = [];

  for (const userDoc of userDocs.docs) {
    const user = userDoc.data();
    if (addresses.includes(user.privyAddress as Hex)) {
      adminWriters.push(user);
    }

    /*
    const userFcAddresses = await getVerifiedAddresses(user.id);
    if (userFcAddresses.some(fcAddress => addresses.includes(fcAddress))) {
      adminWriters.push(user);
    }
    */
  }

  for (const adminWriter of adminWriters) {
    // Add user as a admin writer to the group
    await addWriterToRoom({
      roomId,
      userId: adminWriter.id,
    });
  }
};

const syncRooms = async () => {
  const groups = await getGroups();

  for (const { id } of groups.groupsList) {
    const groupData = await getGroupData(id);

    await upsertRoom({
      groupId: id,
      name: groupData.displayName,
    });

    await upsertAdminWriters(id, groupData);
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
