import axios from 'axios';

export const useGetCombinedAnonSet = () => {
  // NOTE: eventually this should use caching on the backend
  const getSetUnion = async (sets: string[]): Promise<number> => {
    let unionAddresses: Set<string> = new Set();
    for (const set of sets) {
      const res = await axios.get(`/${set}.json`);

      const merkleProofs: {
        address: string;
        merkleProof: {
          root: string;
          pathIndices: string[];
          siblings: string[];
        };
      }[] = res.data;
      const addresses = merkleProofs.map((mp) => mp.address);

      addresses.forEach((a) => unionAddresses.add(a));
    }

    return unionAddresses.size;
  };

  return getSetUnion;
};
