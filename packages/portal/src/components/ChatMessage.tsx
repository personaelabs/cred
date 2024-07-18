/* eslint-disable @next/next/no-img-element */
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { MessageWithUserData } from '@/types';
import AvatarWithFallback from './AvatarWithFallback';
import { Copy, Reply, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import useMessage from '@/hooks/useMessage';
import Link from 'next/link';
import {
  copyTextToClipboard,
  cutoffMessage,
  extractLinks,
  highlightText,
} from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { toast } from 'sonner';
import { useLongPress } from 'use-long-press';
import LinkPreview from './LinkPreview';
import { MessageVisibility } from '@cred/shared';
import { ChevronDown } from 'lucide-react';
import EmojiModal from './modals/EmojiModal';
import MessageReactionsModal from './modals/MessageReactionsModal';

interface ChatMessageDropdownContentProps {
  onReplyClick: () => void;
  onCopyClick: () => void;
  onReactClick: (_reaction: string) => void;
}

const reactions = ['👍', '❤️', '🔥', '🙏'];
const ChatMessageDropdownContent = (props: ChatMessageDropdownContentProps) => {
  const { onReplyClick, onCopyClick, onReactClick } = props;
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  return (
    <DropdownMenuContent className="bg-background mt-[-20px] ml-[40px]">
      <DropdownMenuItem onClick={onReplyClick}>
        <Reply className="mr-2 w-4 h-4"></Reply>
        <div>Reply</div>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onCopyClick}>
        <Copy className="mr-2 w-4 h-4"></Copy>
        <div>Copy</div>
      </DropdownMenuItem>
      <div className="flex flex-row p-2">
        {reactions.map((reaction, i) => (
          <div
            key={i}
            onClick={() => onReactClick(reaction)}
            className="hover:bg-slate-700 px-2 rounded-md"
          >
            {reaction}
          </div>
        ))}
        <ChevronDown
          className="hover:bg-slate-700 rounded-md opacity-70"
          onClick={() => {
            setIsEmojiPickerOpen(true);
          }}
        />
      </div>
      <EmojiModal
        isOpen={isEmojiPickerOpen}
        onClose={() => {
          setIsEmojiPickerOpen(false);
        }}
        onEmojiSelect={onReactClick}
      ></EmojiModal>
    </DropdownMenuContent>
  );
};

const SenderMessageDropdownContent = (props: {
  onCopyClick: () => void;
  onDeleteClick: () => void;
}) => {
  const { onCopyClick, onDeleteClick } = props;

  return (
    <DropdownMenuContent className="bg-background mt-[-30px]">
      <DropdownMenuItem onClick={onCopyClick}>
        <Copy className="mr-2 w-4 h-4"></Copy>
        <div>Copy</div>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onDeleteClick} className="text-red-500">
        <Trash2 className="mr-2 w-4 h-4"></Trash2>
        <div>Delete</div>
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

interface MessageReactionsProps {
  roomId: string;
  messageId: string;
  reactions: {
    [key: string]: string;
  };
}

const MessageReactions = (props: MessageReactionsProps) => {
  const { roomId, messageId, reactions } = props;
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);

  return (
    <>
      <div
        className="mt-[-16px] flex flex-row"
        onClick={() => {
          setIsReactionsModalOpen(true);
        }}
      >
        {Object.entries(reactions).map(([_userId, reaction], i) => (
          <div
            key={i}
            className={`flex flex-row items-center ${i !== 0 ? 'ml-[-4px]' : 'ml-[2px]'}`}
          >
            {reaction}
          </div>
        ))}
      </div>
      <MessageReactionsModal
        isOpen={isReactionsModalOpen}
        onClose={() => {
          setIsReactionsModalOpen(false);
        }}
        roomId={roomId}
        messageId={messageId}
        reactions={reactions}
      ></MessageReactionsModal>
    </>
  );
};

interface ChatBubbleProps {
  roomId: string;
  messageId: string;
  isSender: boolean;
  text: string;
  images: string[];
  replyToId: string | null;
  reactions: Record<string, string>;
  user: {
    id: string;
    name: string;
  };
  visibility: MessageVisibility;
  onLongPress: () => void;
  onViewReplyClick: (_replyId: string) => void;
  isFocused: boolean;
}

const ChatBubble = (props: ChatBubbleProps) => {
  const {
    roomId,
    messageId,
    isSender,
    replyToId,
    reactions,
    text,
    visibility,
    user,
    onLongPress,
    onViewReplyClick,
    isFocused,
  } = props;

  const bind = useLongPress(() => {
    onLongPress();
  });

  return (
    <>
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
        <div
          {...bind()}
          className={`flex flex-col mx-2 mt-2 ${isSender ? 'items-end' : 'items-start'}`}
          onContextMenu={e => {
            e.preventDefault();
            onLongPress();
          }}
        >
          <div
            className={`select-none ${text ? '' : 'hidden'} ${isFocused ? 'animate-pulse-once' : ''} text-md px-4 py-2 ${visibility === MessageVisibility.PUBLIC ? 'bg-primary' : 'bg-gray-500'} text-[#000000] text-opacity-80 rounded-lg shadow-md text-left inline`}
            dangerouslySetInnerHTML={{
              __html: highlightText(text),
            }}
          ></div>
          <div className="mt-4 flex flex-col items-center gap-y-1">
            {props.images.map((image, i) => (
              <PhotoProvider key={i}>
                <PhotoView src={image}>
                  <img
                    src={image}
                    className="rounded-xl"
                    width={200}
                    alt="image"
                  ></img>
                </PhotoView>
              </PhotoProvider>
            ))}
          </div>
          <MessageReactions
            roomId={roomId}
            messageId={messageId}
            reactions={reactions}
          ></MessageReactions>
        </div>
      </div>
      {
        // Render link previews
        extractLinks(text).map((link, index) => (
          <div className="p-2" key={index}>
            <LinkPreview url={link}></LinkPreview>
          </div>
        ))
      }
    </>
  );
};

interface ChatMessageAvatarProps {
  user: MessageWithUserData['user'];
}

const ChatMessageAvatar = (props: ChatMessageAvatarProps) => {
  const { user } = props;

  return (
    <div className="mb-5 ml-1">
      <Link className="no-underline" href={`/users/${user.id}`}>
        <AvatarWithFallback
          size={40}
          imageUrl={user.avatarUrl}
          alt="profile image"
          name={user.name}
        ></AvatarWithFallback>
      </Link>
      {
        // Render moderator badge
        user.isMod ? (
          <div className="text-xs opacity-80 text-primary mt-1 mr-1 text-center">
            mod
          </div>
        ) : (
          <></>
        )
      }
    </div>
  );
};

interface ChatMessageTimestampProps {
  createdAt: Date;
}

const ChatMessageTimestamp = (props: ChatMessageTimestampProps) => {
  return (
    <div className="flex flex-row items-center justify-between">
      <div className="opacity-50 px-4 mt-1 text-xs">
        {new Date(props.createdAt).toLocaleString()}
      </div>
    </div>
  );
};

type ChatMessageProps = MessageWithUserData & {
  isSender: boolean;
  messageId: string;
  isFocused: boolean;
  renderAvatar: boolean;
  onReplySelect: (_message: MessageWithUserData) => void;
  onViewReplyClick: (_replyId: string) => void;
  onDeleteClick: (_messageId: string) => void;
  onReactionClick: (_reaction: string) => void;
  roomId: string;
};

const ChatMessage = (props: ChatMessageProps) => {
  const {
    isSender,
    roomId,
    messageId,
    isFocused,
    replyToId,
    onViewReplyClick,
    user,
    onDeleteClick,
  } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onClickCopyToClipboard = useCallback(async () => {
    await copyTextToClipboard(props.text);
    toast.info('Copied message to clipboard');
  }, [props.text]);

  return (
    <div
      className={`flex items-start mb-5 ${isSender ? 'flex-row-reverse' : 'flex-row'} mt-2`}
    >
      {!isSender ? (
        <ChatMessageAvatar user={props.user}></ChatMessageAvatar>
      ) : (
        <></>
      )}
      <div className="max-w-[70%]">
        <ChatBubble
          roomId={roomId}
          messageId={messageId}
          isFocused={isFocused}
          isSender={isSender}
          text={props.text}
          images={props.images}
          replyToId={replyToId}
          reactions={props.reactions}
          visibility={props.visibility}
          user={user}
          onLongPress={() => {
            setIsMenuOpen(true);
          }}
          onViewReplyClick={onViewReplyClick}
        ></ChatBubble>
        <DropdownMenu
          open={isMenuOpen}
          onOpenChange={open => {
            setIsMenuOpen(open);
          }}
          modal={false}
        >
          <DropdownMenuTrigger disabled></DropdownMenuTrigger>
          {isSender ? (
            <SenderMessageDropdownContent
              onCopyClick={onClickCopyToClipboard}
              onDeleteClick={() => {
                onDeleteClick(props.id);
              }}
            ></SenderMessageDropdownContent>
          ) : (
            <ChatMessageDropdownContent
              onReplyClick={() => {
                props.onReplySelect(props);
              }}
              onCopyClick={onClickCopyToClipboard}
              onReactClick={reaction => {
                props.onReactionClick(reaction);
                // We need to explicitly close the dropdown after reacting,
                // since the reactions aren't wrapped in a `DropdownMenuItem` component
                setIsMenuOpen(false);
              }}
            ></ChatMessageDropdownContent>
          )}
        </DropdownMenu>
        <ChatMessageTimestamp
          createdAt={props.createdAt}
        ></ChatMessageTimestamp>
      </div>
    </div>
  );
};

export default ChatMessage;
