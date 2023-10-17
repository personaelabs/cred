import axios from 'axios';

export const useGetUserProofs = () => {
  const getUserProofs = async (handle: string) => {
    const { data } = await axios.get(`/api/users/${handle}/proofs`);
    return data;
  };

  return getUserProofs;
};
