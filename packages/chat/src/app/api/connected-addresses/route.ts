import { addUserConnectedAddress } from '@/lib/backend/connectedAddress';
import privy, { isAuthenticated } from '@/lib/backend/privy';
import { getGroupLatestMerkleTree } from '@/lib/credddApi';
import { constructAttestationMessage, fromHexString } from '@/lib/utils';
import { ConnectAddressRequestBody } from '@/types';
import { addWriterToRoom } from '@cred/firebase';
import { NextRequest } from 'next/server';
import { Hex, verifyMessage } from 'viem';

/**
 * Returns `true` if the address is a member of the group
 */
const isAddressMemberOfGroup = async (address: Hex, groupId: string) => {
  // Get the tree from the database?
  const groupLatestMerkleTree = await getGroupLatestMerkleTree(groupId);
  const layers = groupLatestMerkleTree.getLayersList();

  // Get the leaves of the tree
  const leaves = layers[0].getNodesList();

  // Convert the address to a buffer
  const addressBuffer = Buffer.from(fromHexString(address, 20));

  // Find the leaf index
  return leaves.some(leaf => {
    const leafBytes = leaf.getNode_asU8();
    return addressBuffer.equals(Buffer.from(leafBytes));
  });
};

export async function POST(req: NextRequest) {
  const verifiedClaims = await isAuthenticated(req);

  const body = (await req.json()) as ConnectAddressRequestBody;

  const user = await privy.getUser(verifiedClaims.userId);
  const { address, signature, groupIds } = body;

  const userPrivyAddress = user.wallet?.address;

  if (!userPrivyAddress) {
    return new Response('User doesn`t have a wallet', { status: 400 });
  }

  const message = constructAttestationMessage(userPrivyAddress);

  const isValid = await verifyMessage({
    address,
    message,
    signature,
  });

  if (!isValid) {
    return new Response('Invalid signature', { status: 400 });
  }

  await addUserConnectedAddress({
    userId: verifiedClaims.userId,
    address,
  });

  const areGroupsValid = await Promise.all(
    groupIds.map(groupId => isAddressMemberOfGroup(address, groupId))
  );

  if (areGroupsValid.some(b => !b)) {
    return new Response('Address is not a member of the provided group', {
      status: 400,
    });
  }

  for (const groupId of groupIds) {
    await addWriterToRoom({
      roomId: groupId,
      userId: verifiedClaims.userId,
    });
  }

  return new Response('OK');
}
