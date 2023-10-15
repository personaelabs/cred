import { publicClient } from './opClient';
const abi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'id', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'recovery', type: 'address' },
    ],
    name: 'ChangeRecoveryAddress',
    type: 'event',
  },
];

// Get Fid from the recovery address
export const getFid = async (address: string): Promise<string | null> => {
  const logs = await publicClient.getContractEvents({
    address: '0x00000000FcAf86937e41bA038B4fA40BAA4B780A',
    abi,
    args: {
      recovery: address,
    },
    eventName: 'ChangeRecoveryAddress',
    fromBlock: BigInt(110766898),
    toBlock: BigInt(110790194),
  });

  if (logs.length === 0) {
    return null;
  }

  const log = logs[0];
  return BigInt(log.topics[1] as string).toString(10);
};
