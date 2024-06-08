'use client';
import AvatarWithFallback from '@/components/AvatarWithFallback';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useUser from '@/hooks/useUser';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

const UserPage = () => {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const { setOptions } = useHeaderOptions();

  const { data: user } = useUser(userId);

  useEffect(() => {
    if (user) {
      setOptions({
        title: user.displayName,
        showBackButton: true,
      });
    } else {
      setOptions({
        title: '',
        showBackButton: true,
      });
    }
  }, [user, setOptions]);

  if (!user) {
    return <></>;
  }

  return (
    <div className="flex flex-col items-center py-4">
      <AvatarWithFallback
        imageUrl={user?.pfpUrl}
        name={user?.displayName}
        alt="User profile picture"
        size={100}
      ></AvatarWithFallback>
      <div className="text-2xl mt-4">{user.displayName}</div>
    </div>
  );
};

export default UserPage;
