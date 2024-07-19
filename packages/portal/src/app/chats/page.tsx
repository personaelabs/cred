'use client';
import { Bell, BellOff, Circle, Ellipsis, SquareArrowLeft } from 'lucide-react';
import { useHeaderOptions } from '@/contexts/HeaderContext';
/* eslint-disable @next/next/no-img-element */
import useJoinedRooms from '@/hooks/useJoinedRooms';
import useSignedInUser from '@/hooks/useSignedInUser';
import { useEffect, useState } from 'react';
import useLeaveRoom from '@/hooks/useLeaveRoom';
import Scrollable from '@/components/Scrollable';
import { useScrollableRef } from '@/contexts/FooterContext';
import { cutoffMessage, getPortalClosesIn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useUser from '@/hooks/useUser';
import useToggleMute from '@/hooks/useToggleMute';
import useReadTicket from '@/hooks/useReadTicket';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import useRoomLatestMessage from '@/hooks/useRoomLatestMessage';

interface RoomItemDropdownContentProps {
  onLeaveClick: () => void;
  showMuteToggle: boolean;
  isMuted: boolean;
  onToggleMuteClick: () => void;
}

const RoomItemDropdownContent = (props: RoomItemDropdownContentProps) => {
  const { onLeaveClick, isMuted, onToggleMuteClick, showMuteToggle } = props;
  return (
    <DropdownMenuContent side="left" className="bg-background">
      {showMuteToggle ? (
        <DropdownMenuItem onClick={onToggleMuteClick}>
          {isMuted ? (
            <>
              <Bell className="mr-2 w-4 h-4"></Bell>
              <div>Unmute</div>
            </>
          ) : (
            <>
              <BellOff className="mr-2 w-4 h-4"></BellOff>
              <div>Mute</div>
            </>
          )}
        </DropdownMenuItem>
      ) : (
        <></>
      )}
      <DropdownMenuItem onClick={onLeaveClick}>
        <SquareArrowLeft className="mr-2 w-4 h-4 text-red-500"></SquareArrowLeft>
        <div className="text-red-500">Leave</div>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};

type RoomItemProps = {
  id: string;
  name: string;
  imageUrl: string | null;
  pinnedMessage: string | null;
  isMuted: boolean;
  showMuteToggle: boolean;
  isPurchasedRoom: boolean;
  isOpenUntil: Date | null;
};

const RoomItem = (props: RoomItemProps) => {
  const { id, isOpenUntil, name, isMuted, showMuteToggle, isPurchasedRoom } =
    props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const { data: singedInUser } = useSignedInUser();
  const [unreadMessageExists, setUnreadMessageExists] = useState(false);

  const { mutateAsync: leaveRoom } = useLeaveRoom();
  const { mutateAsync: toggleMute } = useToggleMute();

  const { data: readTicket } = useReadTicket(id);
  const { data: roomLatestMessage } = useRoomLatestMessage(id);

  useEffect(() => {
    const isLatestMessageFromSignedInUser =
      roomLatestMessage?.userId === singedInUser?.id;

    const latestReadTicket =
      (readTicket?.latestReadMessageCreatedAt as Date) || new Date(0);

    const _unreadMessageExists = roomLatestMessage
      ? (roomLatestMessage.createdAt as Date) > latestReadTicket &&
        !isLatestMessageFromSignedInUser
      : false;

    setUnreadMessageExists(_unreadMessageExists);
  }, [roomLatestMessage, readTicket, singedInUser]);

  const isOpen = isOpenUntil ? isOpenUntil > new Date() : false;

  const portalClosesIn = isOpenUntil
    ? getPortalClosesIn(new Date(isOpenUntil))
    : '';

  return (
    <>
      <Link
        href={isMenuOpen ? '' : `/chats/${id}`}
        className={`w-full no-underline ${isClicked ? 'opacity-60' : ''}`}
        onClick={() => {
          setIsClicked(true);
        }}
      >
        <div className="flex flex-row justify-between w-full h-full border-b-2">
          <div
            className={`flex flex-col items-start px-5 py-2 ${isOpen ? '' : 'opacity-60'}`}
          >
            <div
              className={`text-lg ${isPurchasedRoom ? '' : 'font-bold text-primary'}`}
            >
              {name}
            </div>
            <div className="opacity-60">
              {portalClosesIn === '0'
                ? 'closed'
                : `closes in ${portalClosesIn}`}
            </div>
            <div className="opacity-60 mt-2">
              {roomLatestMessage
                ? `${cutoffMessage(roomLatestMessage.body, 75)}`
                : ''}
            </div>
          </div>
          <div className="flex justify-center items-center">
            {unreadMessageExists ? (
              <Circle className="w-5 h-5 mr-5 opacity-60"></Circle>
            ) : null}
          </div>
          <div className="flex justify-center items-center mb-1">
            <DropdownMenu
              open={isMenuOpen}
              onOpenChange={open => {
                setIsMenuOpen(open);
              }}
            >
              <DropdownMenuTrigger
                className="focus:outline-none"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(prev => !prev);
                }}
              >
                <Ellipsis className="mr-4 opacity-60" />
              </DropdownMenuTrigger>
              <RoomItemDropdownContent
                showMuteToggle={showMuteToggle}
                onLeaveClick={async () => {
                  await leaveRoom(id);
                  setIsMenuOpen(false);
                }}
                isMuted={isMuted}
                onToggleMuteClick={async () => {
                  await toggleMute({ roomId: id, mute: !isMuted });
                  setIsMenuOpen(false);
                }}
              ></RoomItemDropdownContent>
            </DropdownMenu>
          </div>
        </div>
      </Link>
    </>
  );
};

/**
 * Chats page.
 * Render all chats the user has joined.
 */
const Chats = () => {
  const { data: signedInUser } = useSignedInUser();
  const { data: singedInUserData } = useUser(signedInUser?.id || null);
  const { data: rooms } = useJoinedRooms(signedInUser?.id!.toString() || null);
  const { setOptions } = useHeaderOptions();
  const { scrollableRef } = useScrollableRef();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState<
    null | boolean
  >(null);

  useEffect(() => {
    setOptions({
      title: 'My Portals',
      showBackButton: false,
      headerRight: null,
    });
  }, [setOptions]);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setIsNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  if (!signedInUser || !rooms || !singedInUserData) {
    return <div className="bg-background h-full"></div>;
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full bg-background">
        <div className="text-xl opacity-60">No portals found</div>
        <Button className="mt-4" asChild>
          <Link href="/" className="no-underline">
            Browse portals
          </Link>
        </Button>
      </div>
    );
  }
  const writableRooms = rooms.filter(room =>
    room.writerIds.includes(signedInUser.id)
  );

  const purchasedRooms = rooms.filter(
    room =>
      room.readerIds.includes(signedInUser.id) &&
      !room.writerIds.includes(signedInUser.id)
  );

  return (
    <Scrollable>
      <div
        className="flex flex-col items-start bg-background h-full overflow-scroll"
        ref={scrollableRef}
      >
        {[...writableRooms, ...purchasedRooms].map(room => (
          <RoomItem
            id={room.id}
            key={room.id}
            name={room.name}
            pinnedMessage={room.pinnedMessage}
            imageUrl={room.imageUrl}
            showMuteToggle={isNotificationsEnabled !== null}
            isMuted={singedInUserData.config.notification.mutedRoomIds.includes(
              room.id
            )}
            isPurchasedRoom={
              room.readerIds.includes(signedInUser.id) &&
              !room.writerIds.includes(signedInUser.id)
            }
            isOpenUntil={room.isOpenUntil}
          ></RoomItem>
        ))}
      </div>
    </Scrollable>
  );
};

export default Chats;
