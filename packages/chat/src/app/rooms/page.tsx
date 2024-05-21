'use client';
import {
  Bell,
  BellOff,
  Circle,
  Ellipsis,
  KeyRound,
  SquareArrowLeft,
} from 'lucide-react';
import { useHeaderOptions } from '@/contexts/HeaderContext';
/* eslint-disable @next/next/no-img-element */
import useJoinedRooms from '@/hooks/useJoinedRooms';
import useMessages from '@/hooks/useMessages';
import useSignedInUser from '@/hooks/useSignedInUser';
import { useEffect, useState } from 'react';
import useLeaveRoom from '@/hooks/useLeaveRoom';
import Scrollable from '@/components/Scrollable';
import { useScrollableRef } from '@/contexts/FooterContext';
import { cutoffMessage } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useUser from '@/hooks/useUser';
import useToggleMute from '@/hooks/useToggleMute';
import useReadTicket from '@/hooks/useReadTicket';
import useSellKey from '@/hooks/useSellKey';
import ProcessingTxModal from '@/components/ProcessingTxModal';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface RoomItemDropdownContentProps {
  onLeaveClick: () => void;
  showMuteToggle: boolean;
  showSellKey: boolean;
  isMuted: boolean;
  onToggleMuteClick: () => void;
  onSellKeyClick: () => void;
}

const RoomItemDropdownContent = (props: RoomItemDropdownContentProps) => {
  const {
    onLeaveClick,
    isMuted,
    onToggleMuteClick,
    showMuteToggle,
    showSellKey,
  } = props;
  return (
    <DropdownMenuContent side="left" className="bg-background">
      {showSellKey ? (
        <DropdownMenuItem onClick={props.onSellKeyClick}>
          <KeyRound className="mr-2 w-4 h-4 text-blue-500"></KeyRound>
          <div>Sell Key</div>
        </DropdownMenuItem>
      ) : (
        <></>
      )}
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
  isMuted: boolean;
  showMuteToggle: boolean;
  isPurchasedRoom: boolean;
};

const RoomItem = (props: RoomItemProps) => {
  const { id, name, isMuted, showMuteToggle, isPurchasedRoom } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const { mutateAsync: leaveRoom } = useLeaveRoom();
  const { mutateAsync: sellKey, isProcessingTx } = useSellKey(id);
  const { mutateAsync: toggleMute } = useToggleMute();

  const { data: readTicket } = useReadTicket(id);

  const { data: messages } = useMessages({
    roomId: id,
    initMessage: null,
  });

  const firstMessage = messages?.pages?.[0]?.[0];

  let unreadMessageExists = false;
  if (readTicket && firstMessage) {
    unreadMessageExists =
      firstMessage.createdAt > readTicket.latestReadMessageCreatedAt;
  }

  if (!readTicket && firstMessage) {
    unreadMessageExists = true;
  }

  return (
    <>
      <Link
        href={isMenuOpen ? '' : `/rooms/${id}`}
        className={`w-full no-underline ${isClicked ? 'opacity-60' : ''}`}
        onClick={() => {
          setIsClicked(true);
        }}
      >
        <div className="flex flex-row justify-between w-full h-full border-b-2">
          <div className="flex flex-col items-start px-5 py-2">
            <div
              className={`text-lg ${isPurchasedRoom ? '' : 'font-bold text-primary'}`}
            >
              {name}
            </div>
            <div className="opacity-60 mt-1">
              {firstMessage ? `${cutoffMessage(firstMessage.text, 75)}` : ''}
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
                showSellKey={isPurchasedRoom}
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
                onSellKeyClick={async () => {
                  await sellKey();
                  setIsMenuOpen(false);
                }}
              ></RoomItemDropdownContent>
            </DropdownMenu>
          </div>
        </div>
      </Link>
      <ProcessingTxModal isOpen={isProcessingTx}></ProcessingTxModal>
    </>
  );
};

const Rooms = () => {
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
      title: 'Chats',
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
        <div className="text-xl opacity-60">No chats found</div>
        <Button className="mt-4" asChild>
          <Link href="/" className="no-underline">
            Search rooms
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <Scrollable>
      <div
        className="flex flex-col items-start bg-background h-full overflow-scroll"
        ref={scrollableRef}
      >
        {rooms
          .sort((a, b) => {
            if (a.readerIds.includes(signedInUser.id)) {
              return 1;
            }
            if (b.readerIds.includes(signedInUser.id)) {
              return -1;
            }
            return 0;
          })
          .map(room => (
            <RoomItem
              id={room.id}
              key={room.id}
              name={room.name}
              imageUrl={room.imageUrl}
              showMuteToggle={isNotificationsEnabled !== null}
              isMuted={singedInUserData.config.notification.mutedRoomIds.includes(
                room.id
              )}
              isPurchasedRoom={room.readerIds.includes(signedInUser.id)}
            ></RoomItem>
          ))}
      </div>
    </Scrollable>
  );
};

export default Rooms;
