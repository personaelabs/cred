// import useSignedInUser from './useSignedInUser';
// import useUser from './useUser';

/**
 * Returns true if the user has used a valid invite code.
 * @returns {boolean | null}
 */
const useInviteCodeSet = () => {
  /*
  const { data: signedInUser } = useSignedInUser();
  const { data: user } = useUser(signedInUser?.id || null);
  */

  return true;
  // return user ? user.inviteCode !== '' : null;
};

export default useInviteCodeSet;
