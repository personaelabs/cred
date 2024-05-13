'use client';
import AvatarWithFallback from '@/components/Avatar';
import { useHeaderOptions } from '@/contexts/HeaderContext';
/* eslint-disable @next/next/no-img-element */
import useJoinedRooms from '@/hooks/useJoinedRooms';
import useSignedInUser from '@/hooks/useSignedInUser';
import Link from 'next/link';
import { useEffect } from 'react';

type RoomItemProps = {
  id: string;
  name: string;
  imageUrl: string | null;
};

const RoomItem = (props: RoomItemProps) => {
  const { id, name, imageUrl } = props;

  return (
    <Link href={`/rooms/${id}`} className="w-[100%] no-underline">
      <div className="flex flex-row gap-4 items-center px-5">
        <AvatarWithFallback
          imageUrl={imageUrl}
          size={60}
          alt="profile image"
          name={name}
        ></AvatarWithFallback>
        <div className="text-lg">{name}</div>
      </div>
    </Link>
  );
};

const Rooms = () => {
  const { data: signedInUser } = useSignedInUser();
  const { data: rooms } = useJoinedRooms(signedInUser?.id!.toString() || null);
  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    setOptions({
      title: 'Rooms',
      showBackButton: false,
      headerRight: null,
    });
  }, [setOptions]);

  if (!signedInUser || !rooms) {
    return <div className="bg-background h-[100%]"></div>;
  }

  return (
    <div className="h-[100%]">
      <div className="flex flex-col items-start gap-5 bg-background h-[100%] pt-4">
        {rooms.map(room => (
          <RoomItem
            id={room.id}
            key={room.id}
            name={room.name}
            imageUrl={room.imageUrl}
          ></RoomItem>
        ))}
      </div>
    </div>
  );
};

export default Rooms;
