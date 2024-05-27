'use client';

import { Button } from '@/components/ui/button';
import useSignedInUser from '@/hooks/useSignedInUser';
import useAllRooms from '@/hooks/useAllRooms';
import { memo, useCallback, useEffect, useState } from 'react';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import useJoinRoom from '@/hooks/useJoinRoom';
import { useRouter } from 'next/navigation';
import { Alert, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useScrollableRef } from '@/contexts/FooterContext';
import useBuyKey from '@/hooks/useBuyKey';
import useBuyPrice from '@/hooks/useBuyPrice';
import { formatEther } from 'viem';
import ConnectAddressesSheet from '@/components/ConnectAddressesSheet';
import { Room, User } from '@cred/shared';
import useUsers from '@/hooks/useUsers';
import AvatarWithFallback from '@/components/Avatar';
import Scrollable from '@/components/Scrollable';

interface RoomMemberListItemProps {
  user: User;
}

const RoomMemberListItem = memo(function RoomMemberListItem(
  props: RoomMemberListItemProps
) {
  const { user } = props;
  return (
    <div className="ml-[-6px]">
      <AvatarWithFallback
        imageUrl={user?.pfpUrl || null}
        alt={user?.displayName || 'User'}
        size={22}
        name={user?.displayName || ''}
      ></AvatarWithFallback>
    </div>
  );
});

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
          <RoomMemberListItem key={i} user={user}></RoomMemberListItem>
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
  scrollableRef: React.RefObject<HTMLDivElement> | null;
};

const RoomItem = memo(function RoomItem(props: RoomItemProps) {
  const { canJoin, scrollableRef } = props;
  const { name, id } = props.room;
  const { mutateAsync: joinRoom, isPending: isJoining, error } = useJoinRoom();
  const router = useRouter();

  const { mutateAsync: buyKey, isPending, reset } = useBuyKey(id);

  const { data: keyPrice } = useBuyPrice(id);

  const onJoinClick = useCallback(async () => {
    await joinRoom(id);
    router.replace(`/rooms/${id}`);
  }, [id, joinRoom, router]);

  const onPurchaseClick = useCallback(async () => {
    await buyKey();
    if (scrollableRef) {
      scrollableRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
    reset();
  }, [buyKey, reset, scrollableRef]);

  useEffect(() => {
    if (error) {
      console.log(error);
      alert('Failed to join the room');
    }
  }, [error]);

  return (
    <div className="border-b-2 py-4">
      <div className="flex flex-col px-5">
        <div className="flex flex-row items-center justify-between">
          <div
            className={`text-lg text-wrap w-[70%] ${canJoin ? 'font-bold' : 'font-normal'} ${canJoin ? 'text-primary' : ''}`}
          >
            {name}
          </div>
          <div className="text-center w-[30%]">
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
        {!canJoin ? (
          <div>
            <RoomMembersList room={props.room}></RoomMembersList>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
});

export default function Home() {
  const { data: signedInUser } = useSignedInUser();
  const { scrollableRef } = useScrollableRef();
  const { setOptions } = useHeaderOptions();
  const [joinableRooms, setJoinableRooms] = useState<Room[]>([]);
  const [buyableRooms, setBuyableRooms] = useState<Room[]>([]);

  useEffect(() => {
    setOptions({
      title: 'Rooms',
      showBackButton: false,
    });
  }, [setOptions]);

  const { data: allRooms } = useAllRooms();

  useEffect(() => {
    if (allRooms && signedInUser) {
      const _joinableRooms = allRooms.filter(
        room =>
          !room.joinedUserIds.includes(signedInUser.id) &&
          (room.writerIds.includes(signedInUser.id) ||
            room.readerIds.includes(signedInUser.id))
      );

      setJoinableRooms(_joinableRooms);

      const _buyableRooms = allRooms.filter(
        room =>
          !room.joinedUserIds.includes(signedInUser.id) &&
          !room.writerIds.includes(signedInUser.id) &&
          !room.readerIds.includes(signedInUser.id)
      );

      setBuyableRooms(_buyableRooms);
    }
  }, [allRooms, signedInUser]);

  if (!signedInUser) {
    return <div className="bg-background h-full"></div>;
  }

  return (
    <>
      <Scrollable>
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
        {joinableRooms.length > 0 ? (
          <div className="px-5 text-center opacity-60 mt-4">Eligible rooms</div>
        ) : (
          <></>
        )}
        {joinableRooms.map(room => (
          <RoomItem
            key={room.id}
            room={room}
            canJoin={true}
            scrollableRef={scrollableRef}
          ></RoomItem>
        ))}
        {buyableRooms.length > 0 ? (
          <div className="mt-[32px] px-5 text-center opacity-60">
            Buy access to rooms
          </div>
        ) : (
          <></>
        )}
        {buyableRooms
          .sort((a, b) => b.joinedUserIds.length - a.joinedUserIds.length)
          .map(room => (
            <RoomItem
              room={room}
              key={room.id}
              canJoin={false}
              scrollableRef={scrollableRef}
            ></RoomItem>
          ))}
      </Scrollable>
      <ConnectAddressesSheet />
    </>
  );
}
