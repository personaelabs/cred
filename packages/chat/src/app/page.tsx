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
import useBuyPrice from '@/hooks/useBuyPrice';
import { formatEther } from 'viem';
import usePurchasedRooms from '@/hooks/usePurchasedRooms';
import ProcessingTxModal from '@/components/ProcessingTxModal';
import ConnectAddressesSheet from '@/components/ConnectAddressesSheet';
import { Room } from '@cred/shared';
import useUsers from '@/hooks/useUsers';
import AvatarWithFallback from '@/components/Avatar';

interface RoomMembersListProps {
  room: Room;
}

const NUM_USERS_TO_SHOW = 5;
const RoomMembersList = (props: RoomMembersListProps) => {
  const { joinedUserIds } = props.room;

  const { data: users } = useUsers(joinedUserIds.slice(0, NUM_USERS_TO_SHOW));

  return (
    <Link href={`/rooms/${props.room.id}/roomInfo`} className="no-underline">
      <div className="flex flex-row items-center">
        {users?.map((user, i) => (
          <div key={i} className={i !== 0 ? 'ml-[-6px]' : ''}>
            <AvatarWithFallback
              imageUrl={user?.pfpUrl || null}
              alt={user?.displayName || 'User'}
              size={16}
              name={user?.displayName || ''}
            ></AvatarWithFallback>
          </div>
        ))}
        {joinedUserIds.length > NUM_USERS_TO_SHOW ? (
          <div className="text-sm opacity-80">
            +{joinedUserIds.length - NUM_USERS_TO_SHOW}
          </div>
        ) : (
          <></>
        )}
      </div>
    </Link>
  );
};

type RoomItemProps = {
  room: Room;
  canJoin: boolean;
};

const RoomItem = (props: RoomItemProps) => {
  const { canJoin } = props;
  const { name, id } = props.room;
  const { mutateAsync: joinRoom, isPending: isJoining, error } = useJoinRoom();
  const router = useRouter();

  const { mutateAsync: buyKey, isProcessingTx, isPending } = useBuyKey(id);
  const { data: keyPrice } = useBuyPrice(id);

  const onJoinClick = useCallback(async () => {
    await joinRoom(id);
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
  }, [error]);

  return (
    <div className="border-b-2 py-2">
      <div className="flex flex-col px-5">
        <div className="flex flex-row items-center justify-between">
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
        </div>
        <div>
          <RoomMembersList room={props.room}></RoomMembersList>
        </div>
        {
          // TODO: Move this to a parent component
          <ProcessingTxModal isOpen={isProcessingTx} />
        }
      </div>
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
            dataLength={
              purchasableRooms.length +
              writableRooms.length +
              purchasedRooms.length
            }
            hasMore={false}
            next={() => {}}
            scrollThreshold={0.5}
            scrollableTarget="scrollableDiv"
          >
            <Alert>
              <AlertTitle className="flex flx-row justify-between items-center">
                <div className="opacity-70">
                  Connect addresses to find eligible rooms
                </div>
                <Link href="/settings/connected-addresses">
                  <Button variant="secondary">Connect</Button>
                </Link>
              </AlertTitle>
            </Alert>
            {writableRooms.length > 0 || purchasedRooms.length > 0 ? (
              <div className="px-5 text-center opacity-60 mt-4">
                Eligible rooms
              </div>
            ) : (
              <></>
            )}
            {writableRooms.map(room => (
              <RoomItem room={room} key={room.id} canJoin={true}></RoomItem>
            ))}
            {purchasedRooms.map(room => (
              <RoomItem room={room} key={room.id} canJoin={true}></RoomItem>
            ))}
            {purchasableRooms.length > 0 ? (
              <div className="mt-[32px] px-5 text-center opacity-60">
                Buy access to rooms
              </div>
            ) : (
              <></>
            )}
            {purchasableRooms
              .sort((a, b) => b.joinedUserIds.length - a.joinedUserIds.length)
              .map(room => (
                <RoomItem room={room} key={room.id} canJoin={false}></RoomItem>
              ))}
          </InfiniteScroll>
        </div>
      </div>
      <ConnectAddressesSheet />
    </>
  );
}
