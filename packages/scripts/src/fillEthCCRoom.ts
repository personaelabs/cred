import 'dotenv/config';
import { getFirestore } from 'firebase-admin/firestore';
import { addWriterToRoom, app } from '@cred/firebase-admin';
import {
  roomConverter,
  userConverter,
  userCredddConverter,
} from '@cred/shared';
// import credddRpc from './lib/credddRpc';
// import { Hex } from 'viem';

const db = getFirestore(app);

const ETH_CC_ROOM_ID = 'ethcc-2024';
const eligibleCreddd = [
  '098661fd283ac040760e2459aa905ab4eea5af0f1bc4b8ac215bf0aaf9a27b57', // arbitrum aslon
  '0f52c884729bb73f81eafc295e9c8fd492475e28e3cbedba5eed4932049caa70', // base salon
  '5fdd60351ea294f4092f692d4a813419ecba6f6ebb7d6316a2cd90fff4249e0c', // optimism salon
  'b796c128590828f60d84a50abefea8728e3124096614830b371407ab91c86132', // blast salon
  '3c674ad1bf73d3950d1734f4cdc37cd69aec58e9b47c2f19e3784f7e957545a6', // eth salon
];

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

  // Check all user creddd from Firestore
  const allUserCredddDocs = await db
    .collection('userCreddd')
    .withConverter(userCredddConverter)
    .get();

  const allUserCreddd = allUserCredddDocs.docs.map(doc => doc.data());

  for (const user of users) {
    // Add users to rooms based on their connected addresses
    /*
    for (const address of user.connectedAddresses) {
     const creddd = await credddRpc.getAddressGroups(address as Hex);
     console.log(creddd);
    }
    */

    const userCredddDoc = allUserCreddd.find(
      userCreddd => userCreddd.userId === user.id
    );

    if (userCredddDoc) {
      for (const userCreddd of userCredddDoc.creddd) {
        const isUserEligible = eligibleCreddd.includes(userCreddd.groupId);

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

export default fillEthCCRoom;
