'use client';
import AvatarWithFallback from '@/components/Avatar';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useRoom from '@/hooks/useRoom';
import useSignedInUser from '@/hooks/useSignedInUser';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const RoomInfo = () => {
  const params = useParams<{ roomId: string }>();

  const { data: room } = useRoom(params.roomId);
  const router = useRouter();
  const { setOptions } = useHeaderOptions();
  const { data: signedInUser } = useSignedInUser();

  useEffect(() => {
    if (room) {
      setOptions({
        title: room.name,
        showBackButton: true,
      });
    }
  }, [room, setOptions, router, params.roomId, signedInUser]);

  if (!room) {
    return <></>;
  }

  return (
    <div className="flex flex-col items-center py-5">
      <AvatarWithFallback
        imageUrl={room.imageUrl}
        alt="Room image"
        name={room.name}
        size={80}
      ></AvatarWithFallback>
      <div className="text-xl mt-4">{room.name}</div>
    </div>
  );
};

export default RoomInfo;
