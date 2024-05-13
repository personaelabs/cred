'use client';

import { Button } from '@/components/ui/button';
import useSignedInUser from '@/hooks/useSignedInUser';
import usePurchasableRooms from '@/hooks/usePurchasableRooms';
import useWritableRooms from '@/hooks/useWritableRooms';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useCallback, useEffect } from 'react';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useJoinRoom from '@/hooks/useJoinRoom';
import { useRouter } from 'next/navigation';

type PurchasableRoomItemProps = {
  id: string;
  name: string;
  imageUrl: string | null;
  canJoin: boolean;
};

const WritableRoomItem = (props: PurchasableRoomItemProps) => {
  const { name, canJoin, id } = props;
  const {
    mutateAsync: joinRoom,
    isPending: isJoining,
    error,
  } = useJoinRoom({
    roomId: id,
  });
  const router = useRouter();

  const onJoinClick = useCallback(async () => {
    await joinRoom();
    router.replace(`/rooms/${id}`);
  }, [id, joinRoom, router]);

  const onPurchaseClick = useCallback(() => {
    console.log('purchase');
  }, []);

  useEffect(() => {
    if (error) {
      console.log(error);
      alert('Failed to join the room');
    }
  });

  return (
    <div className="flex mt-2 flex-row items-center justify-between px-5">
      <div
        className={`text-md text-wrap w-[55%] ${canJoin ? 'font-bold' : 'font-normal'} ${canJoin ? 'text-primary' : ''}`}
      >
        {name}
      </div>
      <div className="text-center w-[45%]">
        {canJoin ? (
          <Button onClick={onJoinClick} disabled={isJoining} variant="link">
            Join
          </Button>
        ) : (
          <Button onClick={onPurchaseClick} variant="link">
            Buy read access
          </Button>
        )}
      </div>
    </div>
  );
};

export default function Home() {
  const { data: signedInUser } = useSignedInUser();

  const { setOptions } = useHeaderOptions();
  useEffect(() => {
    setOptions({
      title: 'Rooms',
      showBackButton: false,
    });
  }, [setOptions]);

  const { data: purchasableRooms } = usePurchasableRooms(
    signedInUser?.id || null
  );
  const { data: writableRooms } = useWritableRooms(signedInUser?.id || null);

  if (!signedInUser || !purchasableRooms || !writableRooms) {
    return <div className="bg-background h-[100%]"></div>;
  }

  return (
    <div className="h-[100%]">
      <div
        className="flex flex-col bg-background py-4 overflow-auto w-[100%] h-[100%]"
        id="scrollableDiv"
      >
        <InfiniteScroll
          loader={<></>}
          endMessage={<></>}
          dataLength={purchasableRooms.length}
          hasMore={false}
          next={() => {}}
          scrollThreshold={0.5}
          scrollableTarget="scrollableDiv"
        >
          {writableRooms.map(room => (
            <WritableRoomItem
              id={room.id}
              key={room.id}
              name={room.name}
              imageUrl={room.imageUrl}
              canJoin={true}
            ></WritableRoomItem>
          ))}
          {purchasableRooms.map(room => (
            <WritableRoomItem
              id={room.id}
              key={room.id}
              name={room.name}
              imageUrl={room.imageUrl}
              canJoin={false}
            ></WritableRoomItem>
          ))}
        </InfiniteScroll>
      </div>
    </div>
  );
}
