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
import { Alert, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useScrollableRef } from '@/contexts/FooterContext';
import useBuyKey from '@/hooks/useBuyKey';
import useKeyPrice from '@/hooks/useKeyPrice';
import { formatEther } from 'viem';
import usePurchasedRooms from '@/hooks/usePurchasedRooms';
import ProcessingTxModal from '@/components/ProcessingTxModal';
import ConnectAddressesSheet from '@/components/ConnectAddressesSheet';

type RoomItemProps = {
  id: string;
  name: string;
  imageUrl: string | null;
  canJoin: boolean;
};

const RoomItem = (props: RoomItemProps) => {
  const { name, canJoin, id } = props;
  const {
    mutateAsync: joinRoom,
    isPending: isJoining,
    error,
  } = useJoinRoom({
    roomId: id,
  });
  const router = useRouter();

  const { mutateAsync: buyKey, isProcessingTx, isPending } = useBuyKey(id);
  const { data: keyPrice } = useKeyPrice(id);

  const onJoinClick = useCallback(async () => {
    await joinRoom();
    router.replace(`/rooms/${id}`);
  }, [id, joinRoom, router]);

  const onPurchaseClick = useCallback(() => {
    buyKey();
  }, [buyKey]);

  useEffect(() => {
    if (error) {
      console.log(error);
      alert('Failed to join the room');
    }
  });

  return (
    <div className="flex mt-4 flex-row items-center justify-between px-5">
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
          <Button
            onClick={onPurchaseClick}
            disabled={isPending}
            variant="link"
            className="bg-clip-text text-transparent bg-gradient-to-l from-primary to-[#fdb38f]"
          >
            {keyPrice ? formatEther(keyPrice) : ''}ETH
          </Button>
        )}
      </div>
      <ProcessingTxModal isOpen={isProcessingTx} />
    </div>
  );
};

export default function Home() {
  const { data: signedInUser } = useSignedInUser();
  const { scrollableRef } = useScrollableRef();
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
  const { data: purchasedRooms } = usePurchasedRooms(signedInUser?.id || null);

  if (!signedInUser) {
    return <div className="bg-background h-full"></div>;
  }

  return (
    <>
      <div className="h-full">
        <div
          className="flex flex-col bg-background overflow-auto w-full h-full"
          id="scrollableDiv"
          ref={scrollableRef}
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
            <Alert>
              <AlertTitle className="flex flx-row justify-between items-center">
                <div className="opacity-70">Add creddd to join more rooms</div>
                <Link href="/add-creddd">
                  <Button variant="secondary">Add</Button>
                </Link>
              </AlertTitle>
            </Alert>
            {writableRooms.map(room => (
              <RoomItem
                id={room.id}
                key={room.id}
                name={room.name}
                imageUrl={room.imageUrl}
                canJoin={true}
              ></RoomItem>
            ))}
            {purchasedRooms.map(room => (
              <RoomItem
                id={room.id}
                key={room.id}
                name={room.name}
                imageUrl={room.imageUrl}
                canJoin={true}
              ></RoomItem>
            ))}
            {purchasableRooms.map(room => (
              <RoomItem
                id={room.id}
                key={room.id}
                name={room.name}
                imageUrl={room.imageUrl}
                canJoin={false}
              ></RoomItem>
            ))}
          </InfiniteScroll>
        </div>
      </div>
      <ConnectAddressesSheet />
    </>
  );
}
