import axios from 'axios';

export const useGetUserProofs = () => {
  const getUserProofs = async (handle: string, includeProofs: boolean = false) => {
    const { data } = await axios.get(`/api/users/${handle}/proofs`, { params: { includeProofs } });
    return data;
  };

  return getUserProofs;
};
