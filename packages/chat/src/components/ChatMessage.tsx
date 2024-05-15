import { type ChatMessage } from '@/types';
import Avatar from './Avatar';
import { Copy, Reply } from 'lucide-react';
import { useCallback, useState } from 'react';
import useMessage from '@/hooks/useMessage';
import Link from 'next/link';
import { copyTextToClipboard, cutoffMessage } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { toast } from 'sonner';
import { useLongPress } from 'use-long-press';

interface ChatMessageDropdownContentProps {
  onReplyClick: () => void;
  onCopyClick: () => void;
}

const ChatMessageDropdownContent = (props: ChatMessageDropdownContentProps) => {
  const { onReplyClick, onCopyClick } = props;

  return (
    <DropdownMenuContent className="bg-background">
      <DropdownMenuItem onClick={onReplyClick}>
        <Reply className="mr-2 w-4 h-4"></Reply>
        <div>Reply</div>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onCopyClick}>
        <Copy className="mr-2 w-4 h-4"></Copy>
        <div>Copy</div>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};

const SenderMessageDropdownContent = (props: { onCopyClick: () => void }) => {
  const { onCopyClick } = props;

  return (
    <DropdownMenuContent className="bg-background">
      <DropdownMenuItem onClick={onCopyClick}>
        <Copy className="mr-2 w-4 h-4"></Copy>
        <div>Copy</div>
      </DropdownMenuItem>
    </DropdownMenuContent>
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const bind = useLongPress(() => {
    setIsMenuOpen(true);
  });

  const onClickCopyToClipboard = useCallback(async () => {
    await copyTextToClipboard(props.text);
    toast.info('Copied message to clipboard');
  }, [props.text]);

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
          <div className="mx-2 mt-2 text-md px-4 py-2 bg-primary text-[#000000] text-opacity-80 rounded-lg shadow-md text-left">
            <DropdownMenu
              open={isMenuOpen}
              onOpenChange={open => {
                setIsMenuOpen(open);
              }}
            >
              <DropdownMenuTrigger
                disabled
                {...bind()}
                className="text-left  whitespace-pre-wrap focus:outline-none"
              >
                {props.text}
              </DropdownMenuTrigger>
              {isSender ? (
                <SenderMessageDropdownContent
                  onCopyClick={onClickCopyToClipboard}
                ></SenderMessageDropdownContent>
              ) : (
                <ChatMessageDropdownContent
                  onReplyClick={() => {
                    props.onReplySelect(props);
                  }}
                  onCopyClick={onClickCopyToClipboard}
                ></ChatMessageDropdownContent>
              )}
            </DropdownMenu>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between">
          <div className="opacity-50 px-4 mt-1 text-xs">
            {new Date(props.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
