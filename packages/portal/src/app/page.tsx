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
import AvatarWithFallback from '@/components/AvatarWithFallback';
import { getPortalClosesIn } from '@/lib/utils';

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
  const { name, id, pinnedMessage } = props.room;
  const { isPurchased } = props;
  const { mutateAsync: joinRoom, isPending: isJoining, error } = useJoinRoom();
  const router = useRouter();

  const onJoinClick = useCallback(async () => {
    await joinRoom(id);
    router.push(`/chats/${id}`);
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
            <div className="opacity-60">{pinnedMessage || ''}</div>
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
            href={`/portals/${props.room.id}`}
            className="no-underline w-full"
          >
            <div className="flex flex-col justify-start w-[70%]">
              <div className="text-lg text-wrap w-full">{name}</div>
              <div className="opacity-60 flex flex-row justify-between">
                <div>{props.room.pinnedMessage || ''}</div>
                <div>
                  {props.room.isOpenUntil ? (
                    `closes in ${getPortalClosesIn(new Date(props.room.isOpenUntil))}h`
                  ) : (
                    <></>
                  )}
                </div>
              </div>
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

/**
 * Returns true if the user can buy the room key
 */
const canBuyRoomKey = ({
  room,
  userId,
}: {
  room: Room;
  userId: string;
}): boolean => {
  return !!(
    room.isOpenUntil &&
    new Date(room.isOpenUntil).getTime() > Date.now() &&
    !room.joinedUserIds.includes(userId) &&
    !room.writerIds.includes(userId) &&
    !room.readerIds.includes(userId)
  );
};

const canJoinRoom = ({
  room,
  userId,
}: {
  room: Room;
  userId: string;
}): boolean => {
  return !!(
    !room.joinedUserIds.includes(userId) &&
    (room.writerIds.includes(userId) || room.readerIds.includes(userId))
  );
};

const Home = () => {
  const { data: signedInUser } = useSignedInUser();
  const { scrollableRef } = useScrollableRef();
  const { setOptions } = useHeaderOptions();
  const [renderPages, setRenderPages] = useState(10);

  useEffect(() => {
    setOptions({
      title: 'Portals',
      showBackButton: false,
    });
  }, [setOptions]);

  const { data: allRooms } = useAllRooms();

  const buyableRooms = signedInUser
    ? allRooms
        // Sort by the number of users in the room
        .sort((a, b) => b.joinedUserIds.length - a.joinedUserIds.length)
        // Get rooms the user can buy
        .filter(room =>
          canBuyRoomKey({
            room,
            userId: signedInUser.id,
          })
        )
        .slice(0, renderPages)
    : [];

  const joinableRooms = signedInUser
    ? allRooms
        // Get rooms the user can join
        .filter(room =>
          canJoinRoom({
            room,
            userId: signedInUser.id,
          })
        )
    : [];

  if (!signedInUser) {
    return <div className="bg-background h-full"></div>;
  }

  return (
    <div
      className="flex flex-col w-full h-full overflow-scroll"
      ref={scrollableRef}
      id="scrollableDiv"
      onScroll={e => {
        const element = e.currentTarget;
        if (element.scrollHeight > element.clientHeight * 0.3) {
          if (allRooms.length > renderPages) {
            setRenderPages(prev => prev + 10);
          }
        }
      }}
    >
      <Alert>
        <AlertTitle className="flex flx-row justify-between items-center">
          <div className="opacity-70">Add reputation to join portals</div>
          <Link href="/settings/creddd">
            <Button variant="secondary">Add rep</Button>
          </Link>
        </AlertTitle>
      </Alert>
      {joinableRooms.length > 0 ? (
        <div className="px-5 text-center opacity-60 mt-4">Eligible portals</div>
      ) : (
        <></>
      )}
      {
        // Render the joinable rooms
        joinableRooms.map(room => (
          <EligibleRoomItem
            key={room.id}
            room={room}
            isPurchased={
              room.readerIds.includes(signedInUser.id) &&
              !room.writerIds.includes(signedInUser.id)
            }
          ></EligibleRoomItem>
        ))
      }
      {buyableRooms.length > 0 ? (
        <div className="mt-[32px] px-5 text-center opacity-60">
          Buy access to portals
        </div>
      ) : (
        <div className="mt-[32px] px-5 text-center opacity-60">
          No portals open
        </div>
      )}
      {
        // Render the buyable rooms
        buyableRooms.map(room => (
          <PurchasableRoomItem room={room} key={room.id}></PurchasableRoomItem>
        ))
      }
    </div>
  );
};

export default Home;
