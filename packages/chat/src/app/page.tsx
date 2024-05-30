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
import { Room, User } from '@cred/shared';
import useUsers from '@/hooks/useUsers';
import AvatarWithFallback from '@/components/Avatar';

interface RoomMemberListItemProps {
  user: User;
  isFirst: boolean;
}

const RoomMemberListItem = memo(function RoomMemberListItem(
  props: RoomMemberListItemProps
) {
  const { user, isFirst } = props;
  return (
    <div className={`${isFirst ? '' : 'ml-[-6px]'}`}>
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
    <div className="flex flex-row items-center">
      {users?.map((user, i) => (
        <RoomMemberListItem
          key={i}
          user={user}
          isFirst={i === 0}
        ></RoomMemberListItem>
      ))}
      {joinedUserIds.length > NUM_USERS_TO_SHOW ? (
        <div className="text-sm opacity-80">
          +{joinedUserIds.length - NUM_USERS_TO_SHOW}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

type EligibleRoomItemProps = {
  room: Room;
  isPurchased: boolean;
};

const EligibleRoomItem = memo(function EligibleRoom(
  props: EligibleRoomItemProps
) {
  const { name, id } = props.room;
  const { isPurchased } = props;
  const { mutateAsync: joinRoom, isPending: isJoining, error } = useJoinRoom();
  const router = useRouter();

  const onJoinClick = useCallback(async () => {
    await joinRoom(id);
    router.push(`/rooms/${id}`);
  }, [id, joinRoom, router]);

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
          <div className="w-[70%]">
            <div
              className={`text-lg text-wrap w-full ${isPurchased ? '' : 'text-primary font-bold'}`}
            >
              {name}
            </div>
          </div>
          <div className="text-center w-[30%]">
            <Button onClick={onJoinClick} disabled={isJoining} variant="link">
              Join
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

type PurchasableRoomItemProps = {
  room: Room;
};

const PurchasableRoomItem = memo(function PurchasableRoomItem(
  props: PurchasableRoomItemProps
) {
  const { name, id } = props.room;
  const { scrollableRef } = useScrollableRef();

  const { mutateAsync: buyKey, isPending, reset } = useBuyKey(id);

  const { data: keyPrice } = useBuyPrice(id);

  const onPurchaseClick = useCallback(async () => {
    await buyKey();
    if (scrollableRef) {
      scrollableRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
    reset();
  }, [buyKey, reset, scrollableRef]);

  return (
    <div className="border-b-2 py-4">
      <div className="flex flex-col px-5">
        <div className="flex flex-row items-center h-full justify-between">
          <Link
            href={`/rooms/${props.room.id}/roomInfo`}
            className="no-underline w-full"
          >
            <div className="flex flex-col justify-start w-[70%]">
              <div className="text-lg text-wrap w-full">{name}</div>
              <div className="mt-3 w-full">
                <RoomMembersList room={props.room}></RoomMembersList>
              </div>
            </div>
          </Link>
          <div className="text-center w-[30%]">
            <Button
              onClick={onPurchaseClick}
              disabled={isPending}
              variant="outline"
              className="bg-clip-text text-transparent bg-gradient-to-l from-primary to-[#fdb38f]"
            >
              {keyPrice ? formatEther(keyPrice) : ''}ETH
            </Button>
          </div>
        </div>
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
    <div
      className="flex flex-col w-full h-full overflow-scroll"
      ref={scrollableRef}
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
      {joinableRooms.length > 0 ? (
        <div className="px-5 text-center opacity-60 mt-4">Eligible rooms</div>
      ) : (
        <></>
      )}
      {joinableRooms.map(room => (
        <EligibleRoomItem
          key={room.id}
          room={room}
          isPurchased={
            room.readerIds.includes(signedInUser.id) &&
            !room.writerIds.includes(signedInUser.id)
          }
        ></EligibleRoomItem>
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
          <PurchasableRoomItem room={room} key={room.id}></PurchasableRoomItem>
        ))}
    </div>
  );
}
