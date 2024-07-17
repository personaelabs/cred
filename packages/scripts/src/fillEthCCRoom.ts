import 'dotenv/config';
import { getFirestore } from 'firebase-admin/firestore';
import { addWriterToRoom, app } from '@cred/firebase-admin';
import {
  ETH_CC_ROOM_CREDDD,
  ETH_CC_ROOM_ID,
  roomConverter,
  userConverter,
  userCredddConverter,
} from '@cred/shared';
import credddRpc from './lib/credddRpc';
import { Hex } from 'viem';

const db = getFirestore(app);

const fillEthCCRoom = async () => {
  // For all users, check if they are eligible to join the ETHCC 2024 room

  // Check their connected addresses and their creddd

  const ethCcRoomDoc = await db
    .collection('rooms')
    .doc(ETH_CC_ROOM_ID)
    .withConverter(roomConverter)
    .get();
  const ethCcRoom = ethCcRoomDoc.data();

  if (!ethCcRoom) {
    throw new Error(`Room with id ${ETH_CC_ROOM_ID} not found`);
  }

  const userDocs = await db
    .collection('users')
    .withConverter(userConverter)
    .get();

  // Get all users from Firestore
  const users = userDocs.docs.map(doc => doc.data());

  console.log(`Checking ${users.length} users`);

  // Check all user creddd from Firestore
  const allUserCredddDocs = await db
    .collection('userCreddd')
    .withConverter(userCredddConverter)
    .get();

  const allUserCreddd = allUserCredddDocs.docs.map(doc => doc.data());

  for (const user of users) {
    // Add users to rooms based on their connected addresses
    for (const address of user.connectedAddresses) {
      const userAddressGroups = await credddRpc.getAddressGroups(
        address as Hex
      );
      if (
        userAddressGroups.some(group => ETH_CC_ROOM_CREDDD.includes(group.id))
      ) {
        if (!ethCcRoom.writerIds.includes(user.id)) {
          console.log(`Adding user ${user.id} to room ${ETH_CC_ROOM_ID}`);
          await addWriterToRoom({
            roomId: ETH_CC_ROOM_ID,
            userId: user.id,
          });
        }
      }
    }

    const userCredddDoc = allUserCreddd.find(
      userCreddd => userCreddd.userId === user.id
    );

    if (userCredddDoc) {
      for (const userCreddd of userCredddDoc.creddd) {
        const isUserEligible = ETH_CC_ROOM_CREDDD.includes(userCreddd.groupId);

        // If the user is eligible and not already in the room, add them
        if (isUserEligible && !ethCcRoom.writerIds.includes(user.id)) {
          console.log(`Adding user ${user.id} to room ${ETH_CC_ROOM_ID}`);
          await addWriterToRoom({
            roomId: ETH_CC_ROOM_ID,
            userId: user.id,
          });
        }
      }
    } else {
      // No creddd found for user
    }
  }
};

fillEthCCRoom();
