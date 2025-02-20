/* eslint-disable @next/next/no-img-element */
import 'react-photo-view/dist/react-photo-view.css';
import { MessageWithUserData } from '@/types';
import { useEffect, useState } from 'react';
import ChatBubble from './ChatBubble';
import ChatMessageTimestamp from './ChatMessageTimestamp';
import ChatMessageAvatar from './ChatMessageAvatar';
import ChatMessageDropdownMenu from './ChatMessageDropdownMenu';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import MessageReactions from './MessageReactions';
import ReplyPreview from './ReplyPreview';

type ChatMessageProps = {
  message: MessageWithUserData;
  isSender: boolean;
  isReadOnly: boolean;
  isFocused: boolean;
  onReplySelect: (_message: MessageWithUserData) => void;
  onViewReplyClick: (_replyId: string) => void;
  onDeleteClick: (_messageId: string) => void;
  onReactionClick: (_reaction: string) => void;
  resetFocus: () => void;
  roomId: string;
};

const ChatMessage = (props: ChatMessageProps) => {
  const {
    isSender,
    isReadOnly,
    roomId,
    isFocused,
    resetFocus,
    onViewReplyClick,
    message,
  } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFocusIndicator, setShowFocusIndicator] = useState(false);

  const replyToId = message.replyToId;

  useEffect(() => {
    if (isFocused) {
      setShowFocusIndicator(true);
      resetFocus();

      setTimeout(() => {
        setShowFocusIndicator(false);
      }, 1500);
    }
  }, [isFocused, resetFocus]);

  return (
    <div
      className={`flex ${showFocusIndicator ? 'bg-gray-300 bg-opacity-30' : ''} items-start mb-5 ${isSender ? 'flex-row-reverse' : 'flex-row'} mt-2`}
    >
      {!isSender ? (
        <ChatMessageAvatar user={message.user}></ChatMessageAvatar>
      ) : (
        <></>
      )}
      <div className="max-w-[70%]">
        {!isSender && (
          <div className="text-xs text-primary px-[8px]">
            {message.user.name}
          </div>
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
        <ChatBubble
          roomId={roomId}
          isSender={isSender}
          message={message}
          onLongPress={() => {
            setIsMenuOpen(true);
          }}
          onViewReplyClick={onViewReplyClick}
        ></ChatBubble>
        <div className="mt-4 flex flex-col items-center gap-y-1">
          {
            // Render the images attached to the message
            message.images.map((image, i) => (
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
            ))
          }
        </div>
        <MessageReactions
          isSender={isSender}
          roomId={roomId}
          messageId={message.id}
          reactions={message.reactions}
        ></MessageReactions>
        <ChatMessageDropdownMenu
          isReadOnly={isReadOnly}
          isOpen={isMenuOpen}
          onClose={() => {
            setIsMenuOpen(false);
          }}
          isSender={isSender}
          message={message}
          onReplySelect={props.onReplySelect}
          onDeleteClick={props.onDeleteClick}
          onReactionClick={props.onReactionClick}
        ></ChatMessageDropdownMenu>
        <ChatMessageTimestamp
          createdAt={message.createdAt}
        ></ChatMessageTimestamp>
      </div>
    </div>
  );
};

export default ChatMessage;
