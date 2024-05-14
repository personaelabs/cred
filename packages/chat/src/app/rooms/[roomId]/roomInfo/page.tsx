'use client';
import AvatarWithFallback from '@/components/Avatar';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useRoom from '@/hooks/useRoom';
import useSignedInUser from '@/hooks/useSignedInUser';
import useUsers from '@/hooks/useUsers';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

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

  const roomUsersResult = useUsers(room?.joinedUserIds || []);

  if (!room) {
    return <></>;
  }

  return (
    <div
      className="flex flex-col items-center py-5 h-full w-full overflow-auto"
      id="scrollableDiv2"
    >
      <InfiniteScroll
        loader={<></>}
        endMessage={<></>}
        dataLength={room.joinedUserIds.length}
        hasMore={false}
        next={() => {}}
        scrollThreshold={0.5}
        scrollableTarget="scrollableDiv2"
        className="w-full h-full flex flex-col items-center py-4"
      >
        {/**
           * 
        <AvatarWithFallback
          imageUrl={room.imageUrl}
          alt="Room image"
          name={room.name}
          size={80}
        ></AvatarWithFallback>
            */}
        <div className="text-xl mt-4">{room.name}</div>
        <div className="mt-4">
          {roomUsersResult
            ?.filter(({ data: user }) => user)
            .map(({ data: user }) => {
              return (
                <div
                  key={user!.id}
                  className="flex items-center px-5 py-2 mt-1 border-b-2"
                >
                  <AvatarWithFallback
                    imageUrl={user!.pfpUrl}
                    alt="profile image"
                    name={user!.displayName}
                    size={40}
                  ></AvatarWithFallback>
                  <div className="ml-4">{user!.displayName}</div>
                </div>
              );
            })}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default RoomInfo;
