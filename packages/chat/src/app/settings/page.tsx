'use client';
import AvatarWithFallback from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useSignOut from '@/hooks/useSignOut';
/* eslint-disable @next/next/no-img-element */
import useSignedInUser from '@/hooks/useSignedInUser';
import useUsers from '@/hooks/useUsers';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const Settings = () => {
  const { data: signedInUser } = useSignedInUser();
  const { mutateAsync: signOut } = useSignOut();
  const router = useRouter();

  const usersResult = useUsers(signedInUser?.id ? [signedInUser.id] : []);
  const user = usersResult.length > 0 ? usersResult[0].data : null;

  const onSignOutClick = async () => {
    await signOut();
    router.push('/signin');
  };

  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    setOptions({
      title: 'Settings',
      showBackButton: false,
    });
  }, [setOptions]);

  if (!signedInUser || !user) {
    return <div className="bg-background h-[100%]"></div>;
  }

  return (
    <div className="flex flex-col items-center gap-4 pt-8 bg-background h-[100%]">
      <AvatarWithFallback
        imageUrl={user.pfpUrl}
        size={60}
        alt="profile image"
        name={user.displayName}
      ></AvatarWithFallback>
      <div className="text-2xl font-bold">{user.displayName}</div>
      <Button variant="link" onClick={onSignOutClick}>
        Sign out
      </Button>
    </div>
  );
};

export default Settings;
