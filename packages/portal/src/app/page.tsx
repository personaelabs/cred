'use client';
import { CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useSignedInUser from '@/hooks/useSignedInUser';
import useAllRooms from '@/hooks/useAllRooms';
import { memo, useEffect, useState } from 'react';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { useScrollableRef } from '@/contexts/FooterContext';
import { Room, User } from '@cred/shared';
import useUsers from '@/hooks/useUsers';
import AvatarWithFallback from '@/components/AvatarWithFallback';
import { getPortalClosesIn } from '@/lib/utils';
import EnterPortalModal from '@/components/modals/EnterPortalModal';

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

type RoomItemProps = {
  room: Room;
  isPurchased: boolean;
  onEnterClick: () => void;
};

const RoomItem = memo(function EligibleRoom(props: RoomItemProps) {
  const { data: signedInUser } = useSignedInUser();
  const { room } = props;
  const { name } = room;
  const { isPurchased, onEnterClick } = props;

  if (!signedInUser) {
    return <></>;
  }

  const canUserEnter =
    room.writerIds.includes(signedInUser.id) ||
    room.readerIds.includes(signedInUser.id);

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
            <div className="opacity-60">
              {props.room.isOpenUntil ? (
                `closes in ${getPortalClosesIn(new Date(props.room.isOpenUntil))}`
              ) : (
                <></>
              )}
            </div>
            {canUserEnter && (
              <div className="text-sm text-green-300 flex flex-row items-center">
                <CircleCheck className="mr-1 w-3 h-3"></CircleCheck>
                eligible
              </div>
            )}
          </div>
          <div className="text-center w-[30%]">
            <Button onClick={onEnterClick} variant="link">
              enter
            </Button>
          </div>
        </div>
        <div className="mt-3 w-full">
          <RoomMembersList room={props.room}></RoomMembersList>
        </div>
      </div>
    </div>
  );
});

const isRoomOpen = (room: Room): boolean => {
  return room.isOpenUntil ? room.isOpenUntil > new Date() : false;
};

/**
 * Returns true if the user has already joined the room
 */
const alreadyJoinedRoom = ({
  room,
  userId,
}: {
  room: Room;
  userId: string;
}): boolean => {
  return room.joinedUserIds.includes(userId);
};

const Home = () => {
  const { data: signedInUser } = useSignedInUser();
  const { scrollableRef } = useScrollableRef();
  const { setOptions } = useHeaderOptions();
  const [renderPages, setRenderPages] = useState(10);
  const [enterPortalModalOpenFor, setEnterPortalModalOpenFor] =
    useState<Room | null>(null);

  useEffect(() => {
    setOptions({
      title: 'Explore',
      showBackButton: false,
    });
  }, [setOptions]);

  const { data: allRooms } = useAllRooms();

  if (!signedInUser) {
    return <div className="bg-background h-full"></div>;
  }

  const openPortals = allRooms
    // Filter out rooms that are not open
    .filter(isRoomOpen)
    // Filter out rooms that the user has already joined
    .filter(
      room =>
        !alreadyJoinedRoom({
          room,
          userId: signedInUser.id,
        })
    );

  return (
    <>
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
        {openPortals.length === 0 && (
          <div className="text-center mt-4 opacity-60">
            <div className="text-lg">No open portals</div>
          </div>
        )}
        {openPortals.map(room => (
          <RoomItem
            key={room.id}
            room={room}
            isPurchased={
              room.readerIds.includes(signedInUser.id) &&
              !room.writerIds.includes(signedInUser.id)
            }
            onEnterClick={() => {
              setEnterPortalModalOpenFor(room);
            }}
          ></RoomItem>
        ))}
      </div>
      {enterPortalModalOpenFor && (
        <EnterPortalModal
          onClose={() => {
            setEnterPortalModalOpenFor(null);
          }}
          isOpen={true}
          room={enterPortalModalOpenFor}
        ></EnterPortalModal>
      )}
    </>
  );
};

export default Home;
