import { type ChatMessage } from '@/types';
import { Tooltip } from '@radix-ui/react-tooltip';
import { TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useState } from 'react';
import Avatar from './Avatar';

type ChatMessageProps = ChatMessage & {
  isSender: boolean;
  renderAvatar: boolean;
};

const ChatMessage = (props: ChatMessageProps) => {
  const { isSender } = props;
  const [isTooltipOpen, setIsToolTipOpen] = useState(false);

  return (
    <div
      className={`flex items-end ${isSender ? 'flex-row-reverse' : 'flex-row'} mt-2`}
    >
      {!isSender ? (
        <Avatar
          size={40}
          imageUrl={props.user.avatarUrl}
          alt="profile image"
          name={props.user.name}
        ></Avatar>
      ) : (
        <></>
      )}
      <div
        className="max-w-[70%]"
        onClick={() => {
          // Send reply to chat
        }}
      >
        <Tooltip open={isTooltipOpen}>
          <TooltipTrigger
            onClick={() => {
              setIsToolTipOpen(!isTooltipOpen);
            }}
          >
            <div className="mx-2 text-md px-4 py-2 bg-primary text-[#000000] text-opacity-80 rounded-lg shadow-md text-left">
              {props.text}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom"></TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default ChatMessage;
