import { Hex } from 'viem';
import { GroupSpec } from '../../types';

const DEV_ADDRESSES: Hex[] = [
  // Dev addresses
  '0x400ea6522867456e988235675b9cb5b1cf5b79c8', // dantehrani.eth
  '0xcb46219ba114245c3a18761e4f7891f9c4bef8c0', // lsankar.eth
  '0x141b63d93daf55bfb7f396eee6114f3a5d4a90b2', // personaelabs.eth
  '0x4f7d469a5237bd5feae5a3d852eea4b65e06aad1', // pfeffunit.eth
];

const DEV_GROUP_SIZE = 1000;

const devResolver = async (): Promise<Hex[]> => {
  const members: Hex[] = [];

  for (const address of DEV_ADDRESSES) {
    members.push(address);
  }

  // Add dummy members till the group size
  for (let i = 0; i < DEV_GROUP_SIZE - DEV_ADDRESSES.length; i++) {
    members.push(`0x${i.toString(16).padStart(40, '0')}`);
  }

  return members;
};

export default devResolver;
