import { MerkleProof } from '@personaelabs/spartan-ecdsa';
import axios from 'axios';

export const useGetMerkleProof = (jsonFileName: string) => {
  const getMerkleProof = async (address: string): Promise<MerkleProof> => {
    const res = await axios.get(`/${jsonFileName}.json`);
    const merkleProofs: {
      address: string;
      merkleProof: {
        root: string;
        pathIndices: string[];
        siblings: string[];
      };
    }[] = res.data;

    const merkleProofJSON = merkleProofs.find(
      (mp) => mp.address.toLocaleLowerCase() === address.toLocaleLowerCase(),
    )?.merkleProof;

    if (!merkleProofJSON) {
      throw new Error('Merkle proof not found');
    }

    // Convert JSON into `MerkleProof`
    const siblings = merkleProofJSON.siblings.map((sibling: string) => [BigInt(sibling)]);
    const pathIndices = merkleProofJSON.pathIndices.map((index: string) => parseInt(index, 10));
    const root = BigInt(`${merkleProofJSON.root}`);

    const merkleProof: MerkleProof = {
      // @ts-ignore
      siblings,
      pathIndices,
      root,
    };

    return merkleProof;
  };

  return getMerkleProof;
};
