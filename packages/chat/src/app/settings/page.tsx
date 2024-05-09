'use client';
import { Button } from '@/components/ui/button';
import useSignOut from '@/hooks/useSignOut';
/* eslint-disable @next/next/no-img-element */
import useSignedInUser from '@/hooks/useSignedInUser';
import useUsers from '@/hooks/useUsers';
import { useRouter } from 'next/navigation';

const Settings = () => {
  const { data: signedInUser } = useSignedInUser();
  const { mutateAsync } = useSignOut();
  const router = useRouter();

  const usersResult = useUsers(
    signedInUser?.fid ? [signedInUser.fid.toString()] : []
  );
  const user = usersResult.length > 0 ? usersResult[0].data : null;

  const onSignOutClick = async () => {
    await mutateAsync();
    router.push('/signin');
  };

  if (!signedInUser || !user) {
    return <div className='bg-background h-[100%]'></div>;
  }

  return (
    <div className="flex flex-col items-center gap-4 pt-8 bg-background h-[100%]">
      <img
        src={user.pfpUrl}
        alt="profile image"
        className="w-[60px] h-[60px] rounded-full object-cover"
      ></img>
      <div className="text-2xl font-bold">{user.displayName}</div>
      <Button variant="link" onClick={onSignOutClick}>
        Sign out
      </Button>
    </div>
  );
};

export default Settings;
