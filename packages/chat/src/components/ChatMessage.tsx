/* eslint-disable @next/next/no-img-element */
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { MessageWithUserData } from '@/types';
import Avatar from './Avatar';
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

interface ChatMessageDropdownContentProps {
  onReplyClick: () => void;
  onCopyClick: () => void;
}

const ChatMessageDropdownContent = (props: ChatMessageDropdownContentProps) => {
  const { onReplyClick, onCopyClick } = props;

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

type ChatMessageProps = MessageWithUserData & {
  isSender: boolean;
  renderAvatar: boolean;
  onReplySelect: (_message: MessageWithUserData) => void;
  onViewReplyClick: (_replyId: string) => void;
  onDeleteClick: (_messageId: string) => void;
  roomId: string;
};

const ChatMessage = (props: ChatMessageProps) => {
  const { isSender, roomId, replyToId, onViewReplyClick, user, onDeleteClick } =
    props;
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
          <div
            {...bind()}
            className={`flex flex-col gap-y-2 mx-2 mt-2 ${isSender ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`${props.text ? '' : 'hidden'} text-md px-4 py-2 ${props.visibility === MessageVisibility.PUBLIC ? 'bg-primary' : 'bg-gray-500'} text-[#000000] text-opacity-80 rounded-lg shadow-md text-left inline`}
              dangerouslySetInnerHTML={{
                __html: highlightText(props.text),
              }}
            ></div>
            <div className="mt-1 flex flex-col items-center gap-y-1">
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
          </div>
        </div>
        {extractLinks(props.text).map((link, index) => (
          <div className="p-2" key={index}>
            <LinkPreview url={link}></LinkPreview>
          </div>
        ))}
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
            ></ChatMessageDropdownContent>
          )}
        </DropdownMenu>
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
