'use client';
import { useHeaderOptions } from '@/contexts/HeaderContext';
/* eslint-disable @next/next/no-img-element */
import useJoinedRooms from '@/hooks/useJoinedRooms';
import useMessages from '@/hooks/useMessages';
import useSignedInUser from '@/hooks/useSignedInUser';
import Link from 'next/link';
import { useEffect } from 'react';

type RoomItemProps = {
  id: string;
  name: string;
  imageUrl: string | null;
};

const RoomItem = (props: RoomItemProps) => {
  const { id, name } = props;

  const { data: messages } = useMessages({
    roomId: id,
    initMessage: null,
  });

  const firstMessage = messages?.pages?.[0]?.[0];

  return (
    <Link href={`/rooms/${id}`} className="w-[100%] no-underline">
      <div className="flex flex-col items-start px-5 py-2 mt-1 border-b-2">
        <div className="text-lg">{name}</div>
        <div className="opacity-60 mt-1">
          {firstMessage ? firstMessage.text : ''}
        </div>
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
      title: 'Chats',
      showBackButton: false,
      headerRight: null,
    });
  }, [setOptions]);

  if (!signedInUser || !rooms) {
    return <div className="bg-background h-[100%]"></div>;
  }

  return (
    <div className="h-[100%]">
      <div className="flex flex-col items-start bg-background h-[100%">
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
