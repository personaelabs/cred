'use client';
import { CircleCheck } from 'lucide-react';
import useSignedInUser from '@/hooks/useSignedInUser';
import useAllRooms from '@/hooks/useAllRooms';
import { memo, useCallback, useEffect, useState } from 'react';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { useScrollableRef } from '@/contexts/FooterContext';
import { Room } from '@cred/shared';
import { getPortalClosesIn } from '@/lib/utils';
import EnterPortalModal from '@/components/modals/EnterPortalModal';
import { useRouter } from 'next/navigation';
import useJoinRoom from '@/hooks/useJoinRoom';

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
  const [isClicked, setIsClicked] = useState(false);

  if (!signedInUser) {
    return <></>;
  }

  const canUserEnter =
    room.writerIds.includes(signedInUser.id) ||
    room.readerIds.includes(signedInUser.id);

  return (
    <div
      className={`border-b-2 py-4 hover:cursor-pointer ${isClicked ? 'opacity-60' : ''}`}
      onClick={() => {
        setIsClicked(true);
        onEnterClick();
      }}
    >
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
        </div>
      </div>
    </div>
  );
});

const isRoomOpen = (room: Room): boolean => {
  return room.isOpenUntil ? room.isOpenUntil > new Date() : false;
};

const Home = () => {
  const { data: signedInUser } = useSignedInUser();
  const { scrollableRef } = useScrollableRef();
  const { setOptions } = useHeaderOptions();
  const [renderPages, setRenderPages] = useState(10);
  const [enterPortalModalOpenFor, setEnterPortalModalOpenFor] =
    useState<Room | null>(null);

  const { mutateAsync: joinRoom } = useJoinRoom();

  const router = useRouter();

  useEffect(() => {
    setOptions({
      title: 'portals',
      showBackButton: false,
    });
  }, [setOptions]);

  const { data: allRooms } = useAllRooms();

  const onEnterClick = useCallback(
    async (room: Room) => {
      if (!signedInUser) {
        throw new Error('User is not signed in');
      }

      // Set a variable indicating whether the user can enter the room or not.
      // A user can enter the room if they are a writer or reader.
      const canEnter =
        room.writerIds.includes(signedInUser.id) ||
        room.readerIds.includes(signedInUser.id);

      if (canEnter) {
        // If the user has not joined the room, join the room
        if (!room.joinedUserIds.includes(signedInUser.id)) {
          await joinRoom(room.id);
        }

        // If user is a writer or reader, redirect to the portal
        router.push(`/portals/${room.id}`);
      } else {
        // If user is not a writer or reader, show the modal to either add creddd or purchase a key
        setEnterPortalModalOpenFor(room);
      }
    },
    [joinRoom, router, signedInUser]
  );

  if (!signedInUser) {
    return <div className="bg-background h-full"></div>;
  }

  const openPortals = allRooms
    // Filter out rooms that are not open
    .filter(isRoomOpen);

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
              onEnterClick(room);
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
