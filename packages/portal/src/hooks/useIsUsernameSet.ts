import useSignedInUser from './useSignedInUser';
import useUser from './useUser';

const useIsUsernameSet = () => {
  const { data: signedInUser } = useSignedInUser();
  const { data: user } = useUser(signedInUser?.id || null);

  return user ? user.username !== '' : null;
};

export default useIsUsernameSet;
