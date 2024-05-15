'use client';
import { Ellipsis, SquareArrowLeft } from 'lucide-react';
import { useHeaderOptions } from '@/contexts/HeaderContext';
/* eslint-disable @next/next/no-img-element */
import useJoinedRooms from '@/hooks/useJoinedRooms';
import useMessages from '@/hooks/useMessages';
import useSignedInUser from '@/hooks/useSignedInUser';
import Link from 'next/link';
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

type RoomItemProps = {
  id: string;
  name: string;
  imageUrl: string | null;
};

const RoomItem = (props: RoomItemProps) => {
  const { id, name } = props;
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const { mutateAsync: leaveRoom } = useLeaveRoom();

  const { data: messages } = useMessages({
    roomId: id,
    initMessage: null,
  });

  const firstMessage = messages?.pages?.[0]?.[0];

  return (
    <Link
      href={isTooltipOpen ? '' : `/rooms/${id}`}
      className="w-full no-underline focus:opacity-60 hover:opacity-60"
    >
      <div className="flex flex-row justify-between w-full h-full border-b-2">
        <div className="flex flex-col items-start px-5 py-2 mt-1">
          <div className="text-lg">{name}</div>
          <div className="opacity-60 mt-1">
            {firstMessage ? `${cutoffMessage(firstMessage.text, 75)}` : ''}
          </div>
        </div>
        <div className="flex justify-center items-center mb-1">
          <DropdownMenu
            open={isTooltipOpen}
            onOpenChange={open => {
              setIsTooltipOpen(open);
            }}
          >
            <DropdownMenuTrigger
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setIsTooltipOpen(prev => !prev);
              }}
            >
              <Ellipsis className="mr-4 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="left" className="bg-background">
              <DropdownMenuItem
                onClick={async () => {
                  await leaveRoom(id);
                  setIsTooltipOpen(false);
                }}
              >
                <SquareArrowLeft className="mr-2 w-4 h-4 text-red-500"></SquareArrowLeft>
                <div className="text-red-500">Leave</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Link>
  );
};

const Rooms = () => {
  const { data: signedInUser } = useSignedInUser();
  const { data: rooms } = useJoinedRooms(signedInUser?.id!.toString() || null);
  const { setOptions } = useHeaderOptions();
  const { scrollableRef } = useScrollableRef();

  useEffect(() => {
    setOptions({
      title: 'Chats',
      showBackButton: false,
      headerRight: null,
    });
  }, [setOptions]);

  if (!signedInUser || !rooms) {
    return <div className="bg-background h-full"></div>;
  }

  return (
    <Scrollable>
      <div
        className="flex flex-col items-start bg-background h-full overflow-scroll"
        ref={scrollableRef}
      >
        {rooms.map(room => (
          <RoomItem
            id={room.id}
            key={room.id}
            name={room.name}
            imageUrl={room.imageUrl}
          ></RoomItem>
        ))}
      </div>
    </Scrollable>
  );
};

export default Rooms;
