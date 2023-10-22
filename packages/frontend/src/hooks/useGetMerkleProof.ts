import { MerkleProof } from '@/types';
import axios from 'axios';

export const useGetMerkleProof = () => {
  const getMerkleProof = async (jsonFileName: string, address: string): Promise<MerkleProof> => {
    const res = await axios.get(`/${jsonFileName}.json`);
    const merkleProofs: {
      address: string;
      merkleProof: MerkleProof;
    }[] = res.data;

    const merkleProof = merkleProofs.find(
      (mp) => mp.address.toLocaleLowerCase() === address.toLocaleLowerCase(),
    )?.merkleProof;

    if (!merkleProof) {
      throw new Error('Merkle proof not found');
    }

    return merkleProof;
  };

  return getMerkleProof;
};
