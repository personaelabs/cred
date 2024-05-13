import { type ChatMessage } from '@/types';
import Avatar from './Avatar';
import { Ellipsis } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useState } from 'react';
import useMessage from '@/hooks/useMessage';
import { Message } from '@cred/shared';
import Link from 'next/link';

type ChatMessageProps = ChatMessage & {
  isSender: boolean;
  renderAvatar: boolean;
  onReplySelect: (_message: ChatMessage) => void;
  onViewReplyClick: (_message: Message) => void;
  roomId: string;
};

const ChatMessage = (props: ChatMessageProps) => {
  const { isSender, roomId, replyToId, onViewReplyClick, user } = props;
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const { data: replyToMessage } = useMessage({
    roomId,
    messageId: replyToId,
  });

  return (
    <div
      className={`flex items-end mb-5 ${isSender ? 'flex-row-reverse' : 'flex-row'} mt-2`}
    >
      {!isSender ? (
        <div className="mb-5">
          <Link className="no-underline" href={`/users/${user.id}`}>
            <Avatar
              size={40}
              imageUrl={user.avatarUrl}
              alt="profile image"
              name={user.name}
            ></Avatar>
          </Link>
        </div>
      ) : (
        <></>
      )}
      <div className="max-w-[70%]">
        <div
          className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}
        >
          {replyToMessage?.body ? (
            <div className="px-3 py-1">
              <div
                className="opacity-70 p-2 border-l-2 border-[#FDA174]"
                onClick={() => {
                  onViewReplyClick(replyToMessage);
                }}
              >
                <div className="w-[100%]">{replyToMessage?.body}</div>
              </div>
            </div>
          ) : (
            <></>
          )}
          <div className="mx-2 text-md px-4 py-2 bg-primary text-[#000000] text-opacity-80 rounded-lg shadow-md text-left">
            {props.text}
          </div>
        </div>
        <div className="flex flex-row items-center justify-between">
          <div className="opacity-50 px-4 mt-1 text-xs">
            {new Date(props.createdAt).toLocaleString()}
          </div>
          <Tooltip
            open={isTooltipOpen}
            onOpenChange={open => {
              setIsTooltipOpen(open);
            }}
          >
            <TooltipTrigger
              onClick={() => {
                setIsTooltipOpen(!isTooltipOpen);
              }}
            >
              {isSender ? <></> : <Ellipsis className="mr-4 opacity-60" />}
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-background">
              <div className="flex flex-col">
                <div
                  onClick={() => {
                    setIsTooltipOpen(false);
                    props.onReplySelect(props);
                  }}
                >
                  Reply
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
