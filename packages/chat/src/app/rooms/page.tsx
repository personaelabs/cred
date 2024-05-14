'use client';
import { Ellipsis } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useHeaderOptions } from '@/contexts/HeaderContext';
/* eslint-disable @next/next/no-img-element */
import useJoinedRooms from '@/hooks/useJoinedRooms';
import useMessages from '@/hooks/useMessages';
import useSignedInUser from '@/hooks/useSignedInUser';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import useLeaveRoom from '@/hooks/useLeaveRoom';
import Scrollable from '@/components/Scrollable';
import { useScrollableRef } from '@/contexts/FooterContext';

type RoomItemProps = {
  id: string;
  name: string;
  imageUrl: string | null;
};

const RoomItem = (props: RoomItemProps) => {
  const { id, name } = props;
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const { mutateAsync: leaveRoom, isPending: isLeaving } = useLeaveRoom();

  const { data: messages } = useMessages({
    roomId: id,
    initMessage: null,
  });

  const firstMessage = messages?.pages?.[0]?.[0];

  return (
    <Link
      href={isTooltipOpen ? '' : `/rooms/${id}`}
      className="w-[100%] no-underline"
    >
      <div className="flex flex-row justify-between w-full h-full border-b-2">
        <div className="flex flex-col items-start px-5 py-2 mt-1">
          <div className="text-lg">{name}</div>
          <div className="opacity-60 mt-1">
            {firstMessage ? firstMessage.text : ''}
          </div>
        </div>
        <div className="flex justify-center items-center mb-1">
          <Tooltip
            open={isTooltipOpen}
            onOpenChange={open => {
              setIsTooltipOpen(open);
            }}
          >
            <TooltipTrigger
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setIsTooltipOpen(prev => !prev);
              }}
            >
              <Ellipsis className="mr-4 opacity-60" />
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-background">
              <div className="flex flex-col">
                <Button
                  className="no-underline"
                  disabled={isLeaving}
                  variant="ghost"
                  onClick={async () => {
                    await leaveRoom(id);
                    setIsTooltipOpen(false);
                  }}
                >
                  Leave
                </Button>
              </div>
            </TooltipContent>
          </Tooltip>
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
    return <div className="bg-background h-[100%]"></div>;
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
