import { publicClient } from '../pages/opClient';
import { fetchQuery, init } from '@airstack/node';
import { FcProfile } from '@/types';

// Initialize the airstack client only when AIRSTACK_API_KEY is set,
// which is the server side.
if (process.env.AIRSTACK_API_KEY) {
  init(process.env.AIRSTACK_API_KEY);
}

// ABI of the `ChangeRecoveryAddress` event emitted from the Farcaster ID registry contract
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
  // @ts-ignore
  const logs = await publicClient.getContractEvents({
    address: '0x00000000FcAf86937e41bA038B4fA40BAA4B780A',
    abi,
    args: {
      recovery: address,
    },
    eventName: 'ChangeRecoveryAddress',
    fromBlock: BigInt(110766898),
  });

  if (logs.length === 0) {
    return null;
  }

  const log = logs[0];
  return BigInt(log.topics[1] as string).toString(10);
};

// Message to sign when linking Farcaster account
export const SIG_MESSAGE = (setName: string) =>
  `I'm linking my Farcaster account to the set ${setName}`;

// Query to fetch Farcaster profile from Airstack
const fcProfileQuery = (fid: string) => `
query MyQuery {
    Socials(
      input: {filter: {dappName: {_eq: farcaster}, identity: {_eq: "fc_fid:${fid}"}}, blockchain: ethereum}
    ) {
      Social {
        id
        userId
        profileImage
        profileUrl
        userHomeURL
        userRecoveryAddress
        userCreatedAtBlockTimestamp
        userAssociatedAddresses
        profileName
        profileTokenUri
        isDefault
        identity
      }
    }
  }
`;

// Fetch Farcaster profile by fid from Airstack
export const getFcProfile = async (fid: string): Promise<FcProfile> => {
  const { data } = await fetchQuery(fcProfileQuery(fid));

  // Find the first profile with a profile name.
  // (There could be multiple profiles for the same fid)
  const social = data?.Socials?.Social.find((s: any) => s?.profileName);

  const name = social?.profileName || '';
  const image = social?.profileImage || '';

  return { name, image };
};
