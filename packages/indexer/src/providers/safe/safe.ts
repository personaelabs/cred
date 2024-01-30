import { Chain, Hex, HttpTransport, PublicClient } from 'viem';

const SAFE_GET_OWNERS_ABI = [
  'function getOwners() public view returns (address[] memory)',
];

export const getSafeOwners = async (
  client: PublicClient<HttpTransport, Chain>,
  safeAddress: Hex
): Promise<string[]> => {
  const owners = (await client.readContract({
    address: safeAddress,
    abi: SAFE_GET_OWNERS_ABI,
    functionName: 'getOwners',
  })) as Hex[];

  if (!owners) {
    return [];
  } else {
    return owners.map((owner: string) => owner.toLowerCase());
  }
};
