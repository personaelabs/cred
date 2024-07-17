import useSignedInUser from './useSignedInUser';
import useUser from './useUser';

const useIsUsernameSet = () => {
  const { data: signedInUser } = useSignedInUser();
  const { data: user } = useUser(signedInUser?.id || null);

  return user ? !!user.username : false;
};

export default useIsUsernameSet;
