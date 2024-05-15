import { type ChatMessage } from '@/types';
import Avatar from './Avatar';
import { Ellipsis } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useState } from 'react';
import useMessage from '@/hooks/useMessage';
import Link from 'next/link';
import { Button } from './ui/button';
import { cutoffMessage } from '@/lib/utils';

interface ChatToolTipProps {
  shown: boolean;
  onReplySelect: () => void;
}

const ChatToolTip = (props: ChatToolTipProps) => {
  const { onReplySelect, shown } = props;
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  if (!shown) {
    return <></>;
  }

  return (
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
        <Ellipsis className="mr-4 opacity-60" />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-background">
        <div className="flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsTooltipOpen(false);
              onReplySelect();
            }}
          >
            Reply
          </Button>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

interface ReplyPreviewProps {
  roomId: string;
  replyToId: string;
  onClickOnPreview: () => void;
}

const ReplyPreview = (props: ReplyPreviewProps) => {
  const { replyToId, roomId, onClickOnPreview } = props;
  const { data: replyToMessage } = useMessage({
    roomId,
    messageId: replyToId,
  });

  return (
    <div className="px-3 py-1">
      <div
        className="opacity-70 p-2 border-l-2 border-[#FDA174]"
        onClick={onClickOnPreview}
      >
        <div className="w-full">
          {cutoffMessage(replyToMessage?.body || '', 80)}
        </div>
      </div>
    </div>
  );
};

type ChatMessageProps = ChatMessage & {
  isSender: boolean;
  renderAvatar: boolean;
  onReplySelect: (_message: ChatMessage) => void;
  onViewReplyClick: (_replyId: string) => void;
  roomId: string;
};

const ChatMessage = (props: ChatMessageProps) => {
  const { isSender, roomId, replyToId, onViewReplyClick, user } = props;

  return (
    <div
      className={`flex items-start mb-5 ${isSender ? 'flex-row-reverse' : 'flex-row'} mt-2`}
    >
      {!isSender ? (
        <div className="mb-5 ml-1">
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
          {isSender ? (
            <></>
          ) : (
            <div className="text-xs ml-2 text-primary">{user.name}</div>
          )}
          {replyToId ? (
            <ReplyPreview
              roomId={roomId}
              replyToId={replyToId}
              onClickOnPreview={() => {
                onViewReplyClick(replyToId);
              }}
            ></ReplyPreview>
          ) : (
            <></>
          )}
          <div className="mx-2 mt-2 text-md px-4 py-2 bg-primary text-[#000000] text-opacity-80 rounded-lg shadow-md text-left whitespace-pre-wrap">
            {props.text}
          </div>
        </div>
        <div className="flex flex-row items-center justify-between">
          <div className="opacity-50 px-4 mt-1 text-xs">
            {new Date(props.createdAt).toLocaleString()}
          </div>
          <ChatToolTip
            shown={!isSender}
            onReplySelect={() => props.onReplySelect(props)}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
