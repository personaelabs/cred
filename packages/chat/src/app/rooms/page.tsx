'use client';
/* eslint-disable @next/next/no-img-element */
import useRooms from '@/hooks/useRooms';
import useSignedInUser from '@/hooks/useSignedInUser';
import Link from 'next/link';

type RoomItemProps = {
  id: string;
  name: string;
  imageUrl: string | null;
};

const RoomItem = (props: RoomItemProps) => {
  const { id, name, imageUrl } = props;

  return (
    <Link href={`/rooms/${id}`} className='w-[100%] no-underline'>
      <div className="flex flex-row gap-4 items-center px-5">
        <img
          src={imageUrl || ''}
          alt="profile image"
          className="w-[60px] h-[60px] rounded-full object-cover"
        ></img>
        <div className='text-lg'>{name}</div>
      </div>
    </Link>
  );
};

const Rooms = () => {
  const { data: signedInUser } = useSignedInUser();
  const { data: rooms } = useRooms(signedInUser?.fid!.toString() || null);

  if (!signedInUser || !rooms) {
    return <div className='bg-background h-[100%]'></div>;
  }

  return (
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
  );
};

export default Rooms;
