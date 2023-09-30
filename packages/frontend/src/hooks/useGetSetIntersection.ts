import axios from 'axios';

export const useGetSetIntersection = () => {
  // NOTE: eventually this should use caching on the backend
  const getSetIntersection = async (sets: string[]): Promise<number> => {
    let intersectionAddresses: Set<string> = new Set();
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

      if (intersectionAddresses.size === 0) {
        intersectionAddresses = new Set(addresses);
      } else {
        let intersection: Set<string> = new Set();
        for (const address of addresses) {
          if (intersectionAddresses.has(address)) {
            intersection.add(address);
          }
        }

        intersectionAddresses = intersection;
      }
    }

    return intersectionAddresses.size;
  };

  return getSetIntersection;
};
