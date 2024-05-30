'use client';
import AvatarWithFallback from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useRoom from '@/hooks/useRoom';
import useSellPrice from '@/hooks/useSellPrice';
import useSignedInUser from '@/hooks/useSignedInUser';
import useUsers from '@/hooks/useUsers';
import { formatEthBalance } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import useSellKey from '@/hooks/useSellKey';
import { KeyRound } from 'lucide-react';

const RoomInfo = () => {
  const params = useParams<{ roomId: string }>();

  const { data: room } = useRoom(params.roomId);
  const router = useRouter();
  const { setOptions } = useHeaderOptions();
  const { data: signedInUser } = useSignedInUser();
  const { data: keySellPrice } = useSellPrice(params.roomId);
  const { mutateAsync: sellKey } = useSellKey(params.roomId);

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
          {roomUsersResult?.data
            .filter(user => user)
            .map(user => {
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
      <div className="flex flex-col items-center mt-8">
        <div>
          <span className="text-blue-500">Key price</span>
          <span className="ml-2 opacity-60">
            {keySellPrice ? formatEthBalance(keySellPrice) : ''} ETH
          </span>
        </div>
        <div className="mt-1"></div>
        <Button
          className="mt-4 text-blue-500"
          variant="secondary"
          onClick={async () => {
            await sellKey();
            router.replace(`/rooms`);
          }}
        >
          <KeyRound className="mr-2 w-3 h-3"></KeyRound>
          Sell key
        </Button>
      </div>
    </div>
  );
};

export default RoomInfo;
