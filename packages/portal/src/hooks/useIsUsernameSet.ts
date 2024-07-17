import useSignedInUser from './useSignedInUser';
import useUser from './useUser';

const useIsUsernameSet = () => {
  const { data: signedInUser, isLoading: isLoadingSingedInUser } =
    useSignedInUser();
  const { data: user, isLoading } = useUser(signedInUser?.id || null);

  if (isLoading || isLoadingSingedInUser) {
    return null;
  }

  return user?.username ? true : false;
};

export default useIsUsernameSet;
